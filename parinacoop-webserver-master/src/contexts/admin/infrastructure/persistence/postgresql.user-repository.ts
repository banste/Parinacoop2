import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../domain/ports/user.repository';
import { Database } from '@/database/database';
import { User } from '../../domain/models/User';
import { Role } from '@/contexts/shared/enums/roles.enum';

@Injectable()
export class PostgreSqlUserRepository implements UserRepository {
  constructor(private db: Database) {}

  async getByRun(run: number): Promise<User | null> {
    const result = await this.db
      .selectFrom('user')
      .where('run', '=', run)
      .select(['run', 'role'])
      .executeTakeFirst();

    return result ? new User(result) : null;
  }

  async getByRole(role: Role): Promise<User[]> {
    const result = await this.db
      .selectFrom('user')
      .where('role', '=', role)
      .select(['run', 'role'])
      .execute();
    return result.map((user) => new User(user));
  }

  async create(user: User): Promise<User> {
    const { run, role, password, address, profile } = user.toValue();
    await this.db
      .insertInto('user')
      .values({
        run,
        role,
        password: password!,
      })
      .executeTakeFirstOrThrow();

    const userClient = new User({ run, role });

    if (profile) {
      const profileResult = await this.db
        .insertInto('client_profile')
        .values({
          user_run: run,
          names: profile.names,
          first_last_name: profile.firstLastName,
          second_last_name: profile.secondLastName,
          email: profile.email,
          cellphone: profile.cellphone,
          document_number: profile.documentNumber,
        })
        .executeTakeFirstOrThrow();
      console.log(profileResult);
    }

    if (address) {
      const addressResult = await this.db
        .insertInto('address')
        .values({
          user_run: run,
          type_address: address.typeAddress,
          street: address.street,
          number: address.number,
          detail: address.detail,
          commune_id: address.communeId,
        })
        .executeTakeFirstOrThrow();
      console.log(addressResult);
    }

    return userClient;
  }
}
