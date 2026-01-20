import { Injectable } from '@nestjs/common';
import { Database } from '@/database/database';

/**
 * Reader for the dap_instructions table.
 *
 * NOTE: this file uses a light 'any' cast when selecting the row to avoid
 * strict Kysely typing issues when the global Tables interface does not
 * declare 'dap_instructions'. This is an intentional minimal patch so that
 * the project compiles. For a robust solution you should add the
 * 'dap_instructions' table definition to your Kysely Tables typings.
 */

export interface DapInstructionsRow {
  id: number;
  bank_name: string;
  account_type: string;
  account_number: string;
  account_holder_name: string;
  account_holder_rut: string;
  email: string | null;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class PostgresDapInstructionsReader {
  constructor(private db: Database) {}

  async getLatest(): Promise<DapInstructionsRow | undefined> {
    // Cast db to any to bypass strict Kysely Table typings if needed.
    // We select the expected columns and then map/return a typed object.
    const row: any = await (this.db as any)
      .selectFrom(('dap_instructions' as any))
      .select([
        'id',
        'bank_name',
        'account_type',
        'account_number',
        'account_holder_name',
        'account_holder_rut',
        'email',
        'description',
        'created_at',
        'updated_at',
      ] as any)
      .orderBy('id', 'desc')
      .executeTakeFirst();

    if (!row) return undefined;

    // Map DB row to the explicit interface (ensure required properties exist)
    const mapped: DapInstructionsRow = {
      id: Number(row.id),
      bank_name: String(row.bank_name ?? ''),
      account_type: String(row.account_type ?? ''),
      account_number: String(row.account_number ?? ''),
      account_holder_name: String(row.account_holder_name ?? ''),
      account_holder_rut: String(row.account_holder_rut ?? ''),
      email: row.email ?? null,
      description: row.description ?? null,
      created_at: row.created_at ? new Date(row.created_at) : new Date(),
      updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
    };

    return mapped;
  }
}