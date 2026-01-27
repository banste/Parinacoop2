import { Injectable, Inject, Logger } from '@nestjs/common';
import { sql } from 'kysely';
import { randomBytes, createHash } from 'crypto';
import { Database } from '../../../../database/database';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user-repository.interface';

/**
 * KyselyUserRepository (manejo seguro de cambios de RUN)
 *
 * - Si al crear un user nuevo para un run no existe user antiguo, generamos un password-hash temporal
 *   para cumplir la restricción NOT NULL en la columna password.
 * - Si existe user antiguo, copiamos su password (hash).
 * - Todo ocurre dentro de una transacción para mantener la integridad.
 *
 * Nota: idealmente el flujo debería requerir que el admin provea/gestione passwords o que la columna
 * password acepte NULL y se obligue al set de password en un proceso seguro (p. ej. restore/nota).
 */

const LOG_DEBUG = true;

@Injectable()
export class KyselyUserRepository implements UserRepository {
  private readonly logger = new Logger(KyselyUserRepository.name);

  constructor(
    @Inject(Database)
    private readonly db: Database,
  ) {}

  private mapRow(row: any): User {
    const runValue = row.user_run ?? row.run ?? null;
    return {
      id: row.id ?? null,
      name: `${row.names ?? ''} ${row.first_last_name ?? ''}`.trim() || null,
      run: runValue != null ? String(runValue) : null,
      email: row.email ?? null,
      role: row.role ?? null,
      active: row.enabled !== undefined ? Boolean(row.enabled) : (row.active ?? null),
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    };
  }

  async findAll(q?: string): Promise<User[]> {
    const profile = 'client_profile';
    const user = 'user';

    const base = this.db
      .selectFrom(profile)
      .leftJoin(user, `${profile}.user_run`, `${user}.run`)
      .select([
        `${profile}.id`,
        `${profile}.user_run`,
        `${user}.run as run`,
        `${profile}.document_number`,
        `${profile}.names`,
        `${profile}.first_last_name`,
        `${profile}.email`,
        `${profile}.created_at`,
        `${profile}.updated_at`,
        `${user}.role`,
        `${user}.enabled`,
      ] as any);

    if (q && q.trim() !== '') {
      const qTrim = q.trim();
      if (/^\d+$/.test(qTrim)) {
        const qNum = Number(qTrim);
        base.where((eb: any) =>
          eb.or([
            eb(`${profile}.user_run`, '=', qNum),
            eb(`${user}.run`, '=', qNum),
          ]),
        );
      } else {
        const like = `%${qTrim}%`;
        base.where((eb: any) =>
          eb.or([
            eb(`${profile}.names`, 'like', like),
            eb(`${profile}.email`, 'like', like),
            eb(`${profile}.document_number`, 'like', like),
          ]),
        );
      }
    }

    const rows = await base.execute();
    if (LOG_DEBUG) this.logger.debug(`[KyselyUserRepository] findAll q=${String(q ?? '')} -> rows=${rows?.length ?? 0}`);
    return rows.map(this.mapRow);
  }

  async findOne(id: number): Promise<User | null> {
    const profile = 'client_profile';
    const user = 'user';

    const row = await this.db
      .selectFrom(profile)
      .leftJoin(user, `${profile}.user_run`, `${user}.run`)
      .select([
        `${profile}.id`,
        `${profile}.user_run`,
        `${user}.run as run`,
        `${profile}.document_number`,
        `${profile}.names`,
        `${profile}.first_last_name`,
        `${profile}.email`,
        `${profile}.created_at`,
        `${profile}.updated_at`,
        `${user}.role`,
        `${user}.enabled`,
      ] as any)
      .where(`${profile}.id`, '=', id)
      .executeTakeFirst();

    return row ? this.mapRow(row) : null;
  }

  /**
   * update: maneja cambio de run asegurando existencia de user destino y manteniendo password.
   */
  async update(id: number, data: Partial<User>): Promise<User> {
    return this.db.transaction().execute(async (trx) => {
      // Leer profile actual
      const profileRow = await trx
        .selectFrom('client_profile')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();

      if (!profileRow) {
        throw new Error('User not found');
      }

      const currentProfileRunRaw = profileRow.user_run ?? (profileRow as any).run ?? null;
      const currentProfileRunStr = currentProfileRunRaw != null ? String(currentProfileRunRaw).trim() : null;
      const currentProfileRunNum = currentProfileRunStr && /^\d+$/.test(currentProfileRunStr) ? Number(currentProfileRunStr) : undefined;

      const newRunRaw = data.run ?? null;
      const newRunStr = newRunRaw != null ? String(newRunRaw).trim() : null;
      const newRunNum = newRunStr && /^\d+$/.test(newRunStr) ? Number(newRunStr) : undefined;

      // Actualizar campos de client_profile (sin tocar user_run todavía)
      const updateProfile: any = {};
      if (data.name !== undefined) {
        const parts = String(data.name).trim().split(/\s+/);
        updateProfile.names = parts[0] ?? null;
        updateProfile.first_last_name = parts.length > 1 ? parts.slice(1).join(' ') : null;
      }
      if (data.email !== undefined) updateProfile.email = data.email;

      if (Object.keys(updateProfile).length > 0) {
        await trx.updateTable('client_profile').set(updateProfile).where('id', '=', id).execute();
      }

      // Si cambia el run, crear/asegurar user destino y actualizar referencias
      if (newRunStr && newRunStr !== currentProfileRunStr) {
        if (LOG_DEBUG) this.logger.debug(`[KyselyUserRepository] run change: ${currentProfileRunStr} -> ${newRunStr}`);

        // ¿Existe ya user con newRun?
        const existingNewUser = await trx
          .selectFrom('user')
          .selectAll()
          .where('run', '=', (newRunNum ?? newRunStr) as any)
          .executeTakeFirst();

        // Se necesita password para insertar; intentamos copiar del user antiguo si existe
        let passwordToUse: string | undefined = undefined;

        if (!existingNewUser) {
          // leer user antiguo para copiar password/otros campos
          const existingOldUser = await trx
            .selectFrom('user')
            .selectAll()
            .where('run', '=', (currentProfileRunNum ?? currentProfileRunStr) as any)
            .executeTakeFirst();

          if (existingOldUser && existingOldUser.password) {
            passwordToUse = existingOldUser.password;
            if (LOG_DEBUG) this.logger.debug('[KyselyUserRepository] copying password from existing old user');
          } else {
            // No existe user antiguo o no tiene password: generamos hash temporal
            const rnd = randomBytes(16);
            const tmp = createHash('sha256').update(rnd).digest('hex');
            passwordToUse = tmp;
            if (LOG_DEBUG) this.logger.debug('[KyselyUserRepository] generated temporary password-hash for new user');
          }

          // Construir nuevo user row
          const newUserRow: any = {
            run: newRunNum ?? (newRunStr as any),
            role: data.role ?? (existingOldUser?.role ?? null),
            enabled: data.active ?? (existingOldUser?.enabled ?? null),
            password: passwordToUse,
          };

          // Insertar nuevo user
          await trx.insertInto('user').values(newUserRow).execute();
          if (LOG_DEBUG) this.logger.debug(`[KyselyUserRepository] inserted new user run=${newRunStr}`);
        } else {
          // existingNewUser existe: actualizar role/enabled si vienen
          const updateExisting: any = {};
          if (data.role !== undefined) updateExisting.role = data.role;
          if (data.active !== undefined) updateExisting.enabled = data.active;
          if (Object.keys(updateExisting).length > 0) {
            await trx.updateTable('user').set(updateExisting).where('run', '=', (newRunNum ?? newRunStr) as any).execute();
          }
        }

        // Actualizar client_profile.user_run al nuevo run (usar número si es posible)
        await trx
          .updateTable('client_profile')
          .set({ user_run: (newRunNum ?? (newRunStr as any)) })
          .where('id', '=', id)
          .execute();

        // Intento de limpieza del user antiguo si quedó huérfano (opcional)
        if (currentProfileRunStr) {
          const refs = await trx
            .selectFrom('client_profile')
            .select(['id'])
            .where('user_run', '=', (currentProfileRunNum ?? currentProfileRunStr) as any)
            .limit(1)
            .execute();

          if (!refs || refs.length === 0) {
            try {
              await trx.deleteFrom('user').where('run', '=', (currentProfileRunNum ?? currentProfileRunStr) as any).execute();
              if (LOG_DEBUG) this.logger.debug(`[KyselyUserRepository] deleted orphan user run=${currentProfileRunStr}`);
            } catch (err) {
              this.logger.debug(`[KyselyUserRepository] could not delete old user run=${currentProfileRunStr}: ${String(err)}`);
            }
          }
        }
      } else {
        // No cambia el run: actualizar role/active en user si solicitado
        if (data.role !== undefined || data.active !== undefined) {
          const updateUser: any = {};
          if (data.role !== undefined) updateUser.role = data.role;
          if (data.active !== undefined) updateUser.enabled = data.active;

          const runForUserWhere = currentProfileRunNum ?? currentProfileRunStr;
          if (runForUserWhere != null) {
            await trx.updateTable('user').set(updateUser).where('run', '=', runForUserWhere as any).execute();
          } else {
            this.logger.debug('[KyselyUserRepository] update: no run available to update user table');
          }
        }
      }

      // Leer y devolver entidad actualizada
      const row = await trx
        .selectFrom('client_profile')
        .leftJoin('user', 'client_profile.user_run', 'user.run')
        .select([
          'client_profile.id',
          'client_profile.user_run',
          'user.run as run',
          'client_profile.document_number',
          'client_profile.names',
          'client_profile.first_last_name',
          'client_profile.email',
          'client_profile.created_at',
          'client_profile.updated_at',
          'user.role',
          'user.enabled',
        ] as any)
        .where('client_profile.id', '=', id)
        .executeTakeFirst();

      if (!row) throw new Error('User not found after update');

      return this.mapRow(row);
    });
  }

  async remove(id: number): Promise<void> {
    const idxRow = await this.db
      .selectFrom('client_profile')
      .select('id')
      .where('id', '=', id)
      .executeTakeFirst();

    if (!idxRow) {
      throw new Error('User not found');
    }

    await this.db
      .deleteFrom('client_profile')
      .where('id', '=', id)
      .execute();
  }
}