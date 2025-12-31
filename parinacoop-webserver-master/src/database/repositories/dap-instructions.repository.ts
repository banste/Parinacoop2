import { Injectable } from '@nestjs/common';
import { Database } from '@/database/database';

@Injectable()
export class DapInstructionsRepository {
  constructor(private readonly db: Database) {}

  async getLatest() {
    return this.db
      // cast table name to any to satisfy Kysely's TableExpression typing
      .selectFrom('dap_instructions' as any)
      .selectAll()
      .orderBy('updated_at', 'desc')
      .limit(1)
      .executeTakeFirst();
  }
}
