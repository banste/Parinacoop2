import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../domain/ports/user.repository';
import { Database } from '@/database/database';
import { User } from '../../domain/models/User';
import { Role } from '@/contexts/shared/enums/roles.enum';
import { sql } from 'kysely';

@Injectable()
export class PostgreSqlUserRepository implements UserRepository {
  constructor(private db: Database) {}

  async getByRun(run: number): Promise<User | null> {
    const result = await this.db
      .selectFrom('user')
      .selectAll()
      .where('user.run', '=', run as any) // temporal si Kysely aún pide cast
      .executeTakeFirst();

    return result ? new User(result as any) : null;
  }

  async getByRole(role: Role): Promise<User[]> {
    const results = await this.db
      .selectFrom('user')
      .selectAll()
      .where('user.role', '=', role as any) // temporal si Kysely aún pide cast
      .execute();

    return results.map((r) => new User(r as any));
  }

  async create(user: User): Promise<User> {
    const { run, role, password, address, profile } = user.toValue();

    // Insert user row
    await this.db
      .insertInto('user')
      .values({
        run, // usar number
        role, // role (enum/string)
        password: password ?? null,
      })
      .executeTakeFirstOrThrow();

    const userClient = new User({ run, role });

    // Insert client_profile if profile provided
    if (profile) {
      await this.db
        .insertInto('client_profile')
        .values({
          user_run: run,
          names: profile.names,
          first_last_name: profile.firstLastName,
          second_last_name: profile.secondLastName,
          email: profile.email,
          cellphone: profile.cellphone,
          // Convertir a string si puede venir como number (evita error de tipado)
          document_number: String(profile.documentNumber ?? ''),
          // Satisfacer tipos que esperan timestamps
          created_at: sql`now()`,
          updated_at: sql`now()`,
        })
        .executeTakeFirstOrThrow();
    }

    // Insert address if provided; incluimos created_at/updated_at para satisfacer los tipos Kysely
    if (address) {
      await this.db
        .insertInto('address')
        .values({
          user_run: run,
          type_address: address.typeAddress,
          street: address.street,
          number: address.number,
          detail: address.detail,
          commune_id: address.communeId,
          created_at: sql`now()`,
          updated_at: sql`now()`,
        })
        .executeTakeFirstOrThrow();
    }

    return userClient;
  }
}