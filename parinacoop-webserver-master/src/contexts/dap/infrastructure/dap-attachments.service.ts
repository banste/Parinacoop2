import { Injectable } from '@nestjs/common';
import { Database } from '@/database/database';

export interface DapAttachmentRecord {
  id: number;
  dap_id: number;
  type: string;
  filename: string;
  storage_path: string;
  uploaded_by_run: number;
  created_at: string;
}

@Injectable()
export class DapAttachmentsRepository {
  constructor(private db: Database) {}

  async create(record: {
    dap_id: number;
    type: string;
    filename: string;
    storage_path: string;
    uploaded_by_run: number;
  }): Promise<DapAttachmentRecord> {
    const r = await this.db
      .insertInto('dap_attachments')
      .values({
        dap_id: record.dap_id,
        type: record.type,
        filename: record.filename,
        storage_path: record.storage_path,
        uploaded_by_run: record.uploaded_by_run,
      })
      .returningAll()
      .executeTakeFirst();
    // Normalize created_at (Date | undefined) to string to satisfy DapAttachmentRecord
    return {
      id: r!.id,
      dap_id: r!.dap_id,
      type: r!.type,
      filename: r!.filename,
      storage_path: r!.storage_path,
      uploaded_by_run: r!.uploaded_by_run,
      created_at: r!.created_at ? r!.created_at.toISOString() : '',
    } as DapAttachmentRecord;
  }

  async findByDap(dapId: number): Promise<DapAttachmentRecord[]> {
    return (await this.db.selectFrom('dap_attachments').selectAll().where('dap_id', '=', dapId).execute()) as DapAttachmentRecord[];
  }

  async findById(id: number): Promise<DapAttachmentRecord | null> {
    return (await this.db.selectFrom('dap_attachments').selectAll().where('id', '=', id).executeTakeFirst()) as DapAttachmentRecord | null;
  }

  async deleteById(id: number): Promise<void> {
    await this.db.deleteFrom('dap_attachments').where('id', '=', id).execute();
  }
}