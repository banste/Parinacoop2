import { Injectable } from '@nestjs/common';
import { Database } from '@/database/database';
import { User } from '../../domain/user';
import { UserRepository } from '../../domain/user.repository';
import { sql } from 'kysely';

@Injectable()
export class PostgresUserRepository implements UserRepository {
  constructor(private db: Database) {}

  async getByRun(run: number): Promise<User | null> {
    const row = await this.db
      .selectFrom('user')
      .leftJoin('client_profile', 'client_profile.user_run', 'user.run')
      .select([
        'user.run as run',
        'user.role as role',
        'user.password as password',
        'client_profile.names as names',
        'client_profile.first_last_name as first_last_name',
        'client_profile.second_last_name as second_last_name',
        'client_profile.email as email',
        'client_profile.cellphone as cellphone',
        'client_profile.document_number as document_number',
      ])
      .where('user.run', '=', run)
      .executeTakeFirst();

    if (!row) return null;

    const primitive: any = {
      run: Number(row.run),
      role: String(row.role),
      password: row.password ?? undefined,
      profile: {
        names: row.names ?? undefined,
        firstLastName: row.first_last_name ?? undefined,
        secondLastName: row.second_last_name ?? undefined,
        email: row.email ?? undefined,
        cellphone: row.cellphone ?? undefined,
        documentNumber: row.document_number ?? undefined,
      },
    };

    return new User(primitive);
  }

  async getByCredentials(run: number, password: string): Promise<User | null> {
    const row = await this.db
      .selectFrom('user')
      .leftJoin('client_profile', 'client_profile.user_run', 'user.run')
      .select([
        'user.run as run',
        'user.role as role',
        'user.password as password',
        'client_profile.names as names',
        'client_profile.first_last_name as first_last_name',
        'client_profile.second_last_name as second_last_name',
        'client_profile.email as email',
        'client_profile.cellphone as cellphone',
        'client_profile.document_number as document_number',
      ])
      .where('user.run', '=', run)
      .where('user.password', '=', password)
      .executeTakeFirst();

    if (!row) return null;

    const primitive: any = {
      run: Number(row.run),
      role: String(row.role),
      password: row.password ?? undefined,
      profile: {
        names: row.names ?? undefined,
        firstLastName: row.first_last_name ?? undefined,
        secondLastName: row.second_last_name ?? undefined,
        email: row.email ?? undefined,
        cellphone: row.cellphone ?? undefined,
        documentNumber: row.document_number ?? undefined,
      },
    };

    return new User(primitive);
  }

  async create(user: User): Promise<User> {
    const p = user.toValue();
    const run = p.run;
    const role = p.role;
    const password = p.password ?? null;
    const profile = p.profile;
    const address = p.address;

    // Insert into user
    await this.db
      .insertInto('user')
      .values({
        run,
        role,
        password,
      })
      .executeTakeFirstOrThrow();

    // Insert client_profile if profile provided
    if (profile) {
      await this.db
        .insertInto('client_profile')
        .values({
          user_run: run,
          names: String(profile.names ?? ''),
          first_last_name: String(profile.firstLastName ?? ''),
          second_last_name: String(profile.secondLastName ?? ''),
          email: String(profile.email ?? ''),
          cellphone: String(profile.cellphone ?? ''),
          document_number: String(profile.documentNumber ?? ''),
          created_at: sql`now()`,
          updated_at: sql`now()`,
        })
        .executeTakeFirstOrThrow();
    }

    // Insert address if provided
    if (address) {
      await this.db
        .insertInto('address')
        .values({
          user_run: run,
          type_address: String(address.typeAddress ?? 'home'),
          street: String(address.street ?? ''),
          number: Number(address.number ?? 0),
          detail: String(address.detail ?? ''),
          commune_id: Number(address.communeId ?? 0),
          created_at: sql`now()`,
          updated_at: sql`now()`,
        })
        .executeTakeFirstOrThrow();
    }

    return new User({ run, role, password: password ?? undefined });
  }

  // Nuevo método: actualizar contraseña del usuario
  async updatePassword(run: number, hashedPassword: string): Promise<void> {
    await this.db
      .updateTable('user')
      .set({ password: hashedPassword })
      .where('run', '=', run)
      .execute();
  }
}