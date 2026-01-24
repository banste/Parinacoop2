import { Injectable, Inject, Logger } from '@nestjs/common';
import { sql } from 'kysely';
import { Database } from '../../../../database/database';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user-repository.interface';

/**
 * Repositorio Kysely para client_profile <-> user.
 * - Usa run (user.run) como identificador de usuario para las operaciones que deben afectar ambas tablas.
 * - Proporciona update(id, data) (por profile.id) y métodos útiles updateByRun / removeByRun.
 *
 * Reglas:
 * - user.run es PK de user.
 * - client_profile.id es PK de client_profile y client_profile.user_run es FK a user.run (único).
 *
 * Al cambiar run (PK) se crea una nueva fila user con el nuevo run, se reasigna client_profile.user_run
 * y se intenta eliminar la fila antigua; si no es posible se marca como disabled (enabled=false).
 */
@Injectable()
export class KyselyUserRepository implements UserRepository {
  private readonly logger = new Logger(KyselyUserRepository.name);

  constructor(
    @Inject(Database)
    private readonly db: Database,
  ) {}

  private mapRow(row: any): User {
    return {
      id: row.id ?? null,
      name: `${row.names ?? ''} ${row.first_last_name ?? ''}`.trim() || null,
      run: row.user_run ?? null,
      email: row.email ?? null,
      role: row.role ?? null,
      active: (row.enabled ?? row.active) ?? null,
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
      const like = `%${qTrim}%`;

      if (/^\d+$/.test(qTrim)) {
        const numeric = Number(qTrim);
        base.where((eb: any) =>
          eb.or([
            eb(`${profile}.names`, 'like', like),
            eb(`${profile}.email`, 'like', like),
            eb(`${profile}.document_number`, 'like', like),
            eb(`${profile}.user_run`, '=', numeric),
            eb(`${user}.run`, '=', numeric),
          ]),
        );
      } else {
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
   * Helper: obtener profile.id a partir de run (user_run)
   * Retorna null si no existe profile con ese user_run.
   */
  private async getProfileIdByRun(trxOrDb: any, run: number): Promise<number | null> {
    const profile = 'client_profile';
    const row = await trxOrDb
      .selectFrom(profile)
      .select(['id'] as const)
      .where(`${profile}.user_run`, '=', run)
      .executeTakeFirst();
    return row?.id ?? null;
  }

  /**
   * Update por profile.id (ruta actual en controller). Internamente usa run para localizar user cuando haga falta.
   */
  async update(id: number, data: Partial<User>): Promise<User> {
    // Si el frontend quiere usar run directamente, puede llamar updateByRun.
    // Aquí mantenemos la API que usa profile.id pero resolvemos run dentro.
    const profileRow = await this.db.selectFrom('client_profile').select(['user_run'] as const).where('client_profile.id', '=', id).executeTakeFirst();
    const currentRun = profileRow?.user_run ?? null;

    // Si el cliente pasó run y quiere identificar por run en lugar de id, delegamos a updateByRun
    if (data.run !== undefined && data.run !== null) {
      // Si el run actual coincide con el nuevo, seguimos con update normal (profile fields + user fields)
      const newRun = Number(data.run);
      if (currentRun != null && currentRun !== newRun) {
        // cambio de run: delegar al flujo que maneja el cambio de PK (creación de nuevo user, reasignación)
        return this.updateByRun(currentRun, data);
      }
      // else: run igual o currentRun null -> continue with normal update that may create user row
    }

    // No cambio de run o no hay currentRun -> hacer update normal (profile fields + user fields usando currentRun)
    // Re-utilizamos la lógica de updateByRun pero pasando currentRun como target
    return this.updateByRun(currentRun, data, id);
  }

  /**
   * Update usando run como identificador principal.
   * - run: current run value (puede ser null si no hay user asociado en profile).
   * - data: Partial<User> con los cambios. Si data.run existe y es distinto a run, se realiza el proceso seguro de cambio de PK.
   * - optionalProfileId: si se conoce el profile.id (evita reconsulta), se puede pasar para optimizar.
   */
  async updateByRun(run: number | null, data: Partial<User>, optionalProfileId?: number): Promise<User> {
    const profile = 'client_profile';
    const user = 'user';

    const profileSet: Record<string, any> = {};
    const userSet: Record<string, any> = {};

    if (data.name !== undefined) {
      const parts = String(data.name).trim().split(/\s+/);
      profileSet['names'] = parts[0] ?? null;
      profileSet['first_last_name'] = parts.slice(1).join(' ') || null;
    }
    if (data.email !== undefined) profileSet['email'] = data.email;

    if (data.role !== undefined) userSet['role'] = data.role;
    if (data.active !== undefined) userSet['enabled'] = data.active;

    const newRunProvided = data.run !== undefined && data.run !== null;

    this.logger.debug(`updateByRun run=${run} profileSet=${JSON.stringify(profileSet)} userSet=${JSON.stringify(userSet)} newRun=${data.run ?? 'n/a'}`);

    // Resolve profile id if not provided
    let profileId = optionalProfileId ?? null;
    if (profileId == null && run != null) {
      profileId = await this.getProfileIdByRun(this.db, run);
    }

    // If profileId still null but profile fields are to be updated and data contains profile id info
    // we won't be able to update profile by run if profileId is null; prefer caller to provide id.
    try {
      await this.db.transaction().execute(async (trx) => {
        // If profileSet present and we have profileId -> update profile
        if (Object.keys(profileSet).length > 0 && profileId != null) {
          await trx.updateTable(profile).set({ ...profileSet, updated_at: sql`now()` as any }).where(`${profile}.id`, '=', profileId).execute();
        } else if (Object.keys(profileSet).length > 0 && profileId == null) {
          // No profile to update by run -> if caller provided optionalProfileId you'll avoid this branch
          this.logger.warn('Profile not found for run, skipping profile update');
        }

        // Handle run changes
        if (newRunProvided) {
          const newRun = Number(data.run);
          if (Number.isNaN(newRun)) throw new Error('Invalid run value');

          // If we don't have a current run but we have profileId -> try to create or link user
          if (run == null) {
            // create user if not exists
            const existing = await trx.selectFrom(user).select(['run'] as const).where(`${user}.run`, '=', newRun).executeTakeFirst();
            if (!existing) {
              await trx.insertInto(user).values({
                run: newRun,
                role: userSet['role'] ?? 'CLIENT',
                password: '',
                password_attempts: 3,
                enabled: userSet['enabled'] ?? true,
                created_at: sql`now()`,
                updated_at: sql`now()`,
              } as any).execute();
            }
            // link profile -> newRun (if we have profileId)
            if (profileId != null) {
              await trx.updateTable(profile).set({ user_run: newRun }).where(`${profile}.id`, '=', profileId).execute();
            }
          } else if (run !== newRun) {
            // Changing PK: create new user copying data from old (if exists), move profile, then remove/soft-delete old user
            const exists = await trx.selectFrom(user).select(['run'] as const).where(`${user}.run`, '=', newRun).executeTakeFirst();
            if (exists) throw new Error(`Run ${newRun} already exists`);

            const oldUser = await trx.selectFrom(user).selectAll().where(`${user}.run`, '=', run).executeTakeFirst();

            if (!oldUser) {
              // If there's no old user, just insert minimal and update profile FK
              await trx.insertInto(user).values({
                run: newRun,
                role: userSet['role'] ?? 'CLIENT',
                password: '',
                password_attempts: 3,
                enabled: userSet['enabled'] ?? true,
                created_at: sql`now()`,
                updated_at: sql`now()`,
              } as any).execute();

              if (profileId != null) {
                await trx.updateTable(profile).set({ user_run: newRun }).where(`${profile}.id`, '=', profileId).execute();
              }
            } else {
              // Insert new user copying oldUser fields
              await trx.insertInto(user).values({
                run: newRun,
                role: userSet['role'] ?? oldUser.role,
                password: oldUser.password,
                password_attempts: oldUser.password_attempts ?? 3,
                enabled: userSet['enabled'] ?? oldUser.enabled ?? true,
                created_at: oldUser.created_at ?? sql`now()`,
                updated_at: sql`now()`,
              } as any).execute();

              if (profileId != null) {
                await trx.updateTable(profile).set({ user_run: newRun }).where(`${profile}.id`, '=', profileId).execute();
              }

              // Try to delete old user; fallback to soft-delete
              try {
                await trx.deleteFrom(user).where(`${user}.run`, '=', run).execute();
              } catch (delErr) {
                this.logger.warn(`Could not delete old user run=${run}, soft-deleting: ${(delErr as Error).message}`);
                await trx.updateTable(user).set({ enabled: false, updated_at: sql`now()` as any }).where(`${user}.run`, '=', run).execute();
              }
            }
          } // end run change branch
        } else {
          // No run change: apply userSet updates to the row identified by run (if exists)
          if (Object.keys(userSet).length > 0) {
            if (run == null) {
              // No user to update; create minimal user if needed
              const createdRun = data.run ?? null;
              if (createdRun != null) {
                await trx.insertInto(user).values({
                  run: createdRun,
                  role: userSet['role'] ?? 'CLIENT',
                  password: '',
                  password_attempts: 3,
                  enabled: userSet['enabled'] ?? true,
                  created_at: sql`now()`,
                  updated_at: sql`now()`,
                } as any).execute();
                if (profileId != null) {
                  await trx.updateTable(profile).set({ user_run: createdRun }).where(`${profile}.id`, '=', profileId).execute();
                }
              } else {
                this.logger.warn('No run available to update user; skipping user update');
              }
            } else {
              await trx.updateTable(user).set({ ...userSet, updated_at: sql`now()` as any }).where(`${user}.run`, '=', run).execute();
            }
          }
        }
      }); // end transaction
    } catch (err) {
      this.logger.error('Error in updateByRun transaction: ' + ((err as Error).message ?? err));
      throw err;
    }

    // Return the updated profile row (resolve by profileId or by run/new run)
    const finalProfileId = profileId ?? (data.run ? await this.getProfileIdByRun(this.db, Number(data.run)) : null);
    if (finalProfileId == null) throw new Error('User/profile not found after update');
    const updated = await this.findOne(finalProfileId);
    if (!updated) throw new Error('User not found after update');
    return updated;
  }

  /**
   * Remove por profile.id (mantiene compatibilidad con controller actual).
   * Internamente usa run para identificar user y tratarlo correctamente.
   */
  async remove(id: number): Promise<void> {
    // Resolver run y delegar en removeByRun si es posible
    const profileRow = await this.db.selectFrom('client_profile').select(['user_run'] as const).where('client_profile.id', '=', id).executeTakeFirst();
    const run = profileRow?.user_run ?? null;
    if (run != null) {
      await this.removeByRun(run);
      return;
    }

    // Si no hay run, simplemente eliminar profile
    await this.db.deleteFrom('client_profile').where('id', '=', id).execute();
  }

  /**
   * Remove por run (eliminar profile(s) y user asociado).
   * Intenta eliminación definitiva; si falla por constraints hace soft-delete del user.
   */
  async removeByRun(run: number): Promise<void> {
    const profile = 'client_profile';
    const user = 'user';

    this.logger.debug(`removeByRun run=${run}`);

    try {
      await this.db.transaction().execute(async (trx) => {
        // delete profile(s) referencing run
        await trx.deleteFrom(profile).where(`${profile}.user_run`, '=', run).execute();

        // try to delete user
        try {
          await trx.deleteFrom(user).where(`${user}.run`, '=', run).execute();
          this.logger.debug(`Deleted user run=${run}`);
        } catch (deleteErr) {
          this.logger.warn(`Could not delete user run=${run} in transaction: ${(deleteErr as Error).message}`);
          throw deleteErr;
        }
      });
    } catch (err) {
      // fallback: ensure profiles removed and soft-delete user
      this.logger.warn('Transaction to delete profile+user failed, attempting fallback soft-delete. Error: ' + ((err as Error).message ?? err));
      try {
        await this.db.deleteFrom(profile).where(`${profile}.user_run`, '=', run).execute().catch(() => {});
        await this.db.updateTable(user).set({ enabled: false, updated_at: sql`now()` as any }).where(`${user}.run`, '=', run).execute();
        this.logger.debug(`Soft-deleted (disabled) user run=${run}`);
      } catch (fallbackErr) {
        this.logger.error('Fallback soft-delete also failed: ' + ((fallbackErr as Error).message ?? fallbackErr));
        throw fallbackErr;
      }
    }
  }
}