import { Injectable } from '@nestjs/common';
import { Database } from '@/database/database';

export interface DapContractRecord {
  id: number;
  dap_id: number;
  filename: string;
  storage_path: string;
  uploaded_by_run: number;
  created_at: string;
}

@Injectable()
export class DapContractsRepository {
  constructor(private db: Database) {}

  async create(record: {
    dap_id: number;
    filename: string;
    storage_path: string;
    uploaded_by_run: number;
  }): Promise<DapContractRecord> {
    const r = await this.db
      .insertInto('dap_contracts')
      .values({
        dap_id: record.dap_id,
        filename: record.filename,
        storage_path: record.storage_path,
        uploaded_by_run: record.uploaded_by_run,
      })
      .returningAll()
      .executeTakeFirst();
    return r as DapContractRecord;
  }

  async findByDap(dapId: number): Promise<DapContractRecord[]> {
    return (await this.db.selectFrom('dap_contracts').selectAll().where('dap_id', '=', dapId).execute()) as DapContractRecord[];
  }

  async findById(id: number): Promise<DapContractRecord | null> {
    return (await this.db.selectFrom('dap_contracts').selectAll().where('id', '=', id).executeTakeFirst()) as DapContractRecord | null;
  }

  async deleteById(id: number): Promise<void> {
    await this.db.deleteFrom('dap_contracts').where('id', '=', id).execute();
  }
}