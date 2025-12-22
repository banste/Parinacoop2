import { Injectable } from '@nestjs/common';
import { Database } from '@/database/database';

@Injectable()
export class DapInstructionsRepository {
  constructor(private readonly db: Database) {}

  async getLatest() {
    return this.db
      .selectFrom('dap_instructions')
      .selectAll()
      .orderBy('updated_at', 'desc')
      .limit(1)
      .executeTakeFirst();
  }
}
