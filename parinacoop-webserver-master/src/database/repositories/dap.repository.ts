import { Injectable } from '@nestjs/common';
import { Database } from '@/database/database';

@Injectable()
export class DapRepository {
  constructor(private readonly db: Database) {}

  async findByIdAndUserRun(id: number, userRun: number) {
    return this.db
      .selectFrom('dap')
      .selectAll()
      .where('id', '=', id)
      .where('user_run', '=', userRun)
      .executeTakeFirst();
  }
}
