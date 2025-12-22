import { Injectable } from '@nestjs/common';
import { Database } from '@/database/database';

export type DapInstructionsRow = {
  bank_name: string;
  account_type: string;
  account_number: string;
  account_holder_name: string;
  account_holder_rut: string;
  email: string | null;
  description: string | null;
  updated_at: Date;
};

@Injectable()
export class PostgreSqlDapInstructionsReader {
  constructor(private readonly db: Database) {}

  async getLatest(): Promise<DapInstructionsRow | undefined> {
    return this.db
      .selectFrom('dap_instructions')
      .select([
        'bank_name',
        'account_type',
        'account_number',
        'account_holder_name',
        'account_holder_rut',
        'email',
        'description',
        'updated_at',
      ])
      .orderBy('updated_at', 'desc')
      .executeTakeFirst();
  }
}
