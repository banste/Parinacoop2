import { Injectable } from '@nestjs/common';
import { UserRepository } from '@/contexts/auth/domain/user.repository';
import { Database } from '@/database/database';
// IMPORT CORRECTO: User del DOMAIN auth (no admin)
import { User } from '@/contexts/auth/domain/User';
import { Role } from '@/contexts/shared/enums/roles.enum';

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
}