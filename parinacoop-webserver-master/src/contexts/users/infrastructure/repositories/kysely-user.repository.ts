import { Injectable, Inject, Logger } from '@nestjs/common';
import { sql } from 'kysely';
import { Database } from '../../../../database/database';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user-repository.interface';

/**
 * Repositorio tipado con Kysely usando la clase Database de src/database.
 * Implementa operaciones findAll, findOne, update y remove.
 *
 * El update está envuelto en transacción para asegurar consistencia.
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
      ] as any)
      .where(`${profile}.id`, '=', id)
      .executeTakeFirst();

    return row ? this.mapRow(row) : null;
  }

  /**
   * Update: se realiza en transacción.
   * Recibe Partial<User> (campo name -> names + first_last_name).
   */
  async update(id: number, data: Partial<User>): Promise<User> {
    const profile = 'client_profile';
    const user = 'user';

    // Normalize input -> sets for each table
    const profileSet: Record<string, any> = {};
    const userSet: Record<string, any> = {};

    if (data.name !== undefined) {
      const parts = String(data.name).trim().split(/\s+/);
      profileSet['names'] = parts[0] ?? null;
      profileSet['first_last_name'] = parts.slice(1).join(' ') || null;
    }
    if (data.email !== undefined) profileSet['email'] = data.email;
    if (data.run !== undefined) {
      profileSet['user_run'] = data.run;
      userSet['run'] = data.run;
    }
    if (data.role !== undefined) userSet['role'] = data.role;

    // run everything in a transaction to avoid partial updates
    try {
      await this.db.transaction().execute(async (trx) => {
        // Use trx for all operations inside the transaction
        if (Object.keys(profileSet).length > 0) {
          await trx
            .updateTable(profile)
            .set({ ...profileSet, updated_at: sql`now()` as any })
            .where(`${profile}.id`, '=', id)
            .execute();
        }

        if (Object.keys(userSet).length > 0) {
          // get current user_run from profile using trx
          const profileRow = await trx
            .selectFrom(profile)
            .select(['user_run'] as const)
            .where(`${profile}.id`, '=', id)
            .executeTakeFirst();

          const userRunVal = profileRow && profileRow.user_run != null ? profileRow.user_run : null;
          if (userRunVal == null) {
            throw new Error('User run not found on profile');
          }

          await trx
            .updateTable(user)
            .set({ ...userSet, fecha_actualizacion: sql`now()` as any })
            .where(`${user}.run`, '=', userRunVal)
            .execute();
        }
      });
    } catch (err) {
      // Log details and rethrow so controller/service return 500 and you can see the cause
      this.logger.error('Error updating user/profile in transaction', (err as Error).stack ?? err);
      throw err;
    }

    const updated = await this.findOne(id);
    if (!updated) throw new Error('User not found after update');
    return updated;
  }

  async remove(id: number): Promise<void> {
    const profile = 'client_profile';
    await this.db.deleteFrom(profile).where('id', '=', id).execute();
  }
}