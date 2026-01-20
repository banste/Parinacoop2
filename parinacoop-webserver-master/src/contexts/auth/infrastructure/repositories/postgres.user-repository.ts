import { Injectable } from '@nestjs/common';
// Importar el contrato correcto dentro del mismo contexto (ruta relativa a domain)
import { UserRepository } from '../../domain/user.repository';
import { Database } from '@/database/database';
// Importar la entidad User desde el domain del contexto auth
import { User } from '../../domain/user';
import { Role } from '@/contexts/shared/enums/roles.enum';
import { sql } from 'kysely';

@Injectable()
export class PostgresUserRepository implements UserRepository {
  constructor(private db: Database) {}

  async getByRun(run: number): Promise<User | null> {
    const result = await this.db
      .selectFrom('user')
      .selectAll()
      .where('user.run', '=', run)
      .executeTakeFirst();

    return result ? new User(result as any) : null;
  }

  async getByCredentials(run: number, password: string): Promise<User | null> {
    const result = await this.db
      .selectFrom('user')
      .selectAll()
      .where('user.run', '=', run)
      .where('user.password', '=', password)
      .executeTakeFirst();

    return result ? new User(result as any) : null;
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
}