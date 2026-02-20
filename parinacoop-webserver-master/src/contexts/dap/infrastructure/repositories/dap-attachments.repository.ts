import { Injectable, Inject } from '@nestjs/common';
import { Database } from '@/database/database';
import { sql } from 'kysely';

@Injectable()
export class DapAttachmentsRepository {
  constructor(@Inject(Database) private readonly db: Database) {}

  async createAttachment(data: any) {
    const row: any = {
      dap_id: Number(data.dap_id),
      filename: String(data.filename ?? ''),
      storage_path: data.storage_path ?? null,
      type: data.type ?? null,
      uploaded_by_run: data.uploaded_by_run ?? null,
      created_at: data.created_at ?? sql`now()`,
      updated_at: data.updated_at ?? sql`now()`,
      mime_type: data.mime_type ?? null,
      size: data.size ?? null,
    };

    // 1) INSERT (sin returning)
    const insertRes = await this.db
      .insertInto('dap_attachments')
      .values(row)
      .executeTakeFirst();

    const newId = Number((insertRes as any)?.insertId);

    // 2) SELECT fila insertada (si por alguna razón no hay insertId, devolvemos fallback)
    if (!newId) {
      return {
        id: null,
        dap_id: row.dap_id,
        filename: row.filename,
        storage_path: row.storage_path,
        type: row.type,
        uploaded_by_run: row.uploaded_by_run,
        created_at: row.created_at,
        updated_at: row.updated_at,
        mime_type: row.mime_type ?? null,
        size: row.size ?? null,
      };
    }

    const inserted = (await this.db
      .selectFrom('dap_attachments')
      .selectAll()
      .where('id', '=', newId)
      .executeTakeFirst()) as any;

    if (!inserted) {
      // ultra defensivo
      return {
        id: newId,
        dap_id: row.dap_id,
        filename: row.filename,
        storage_path: row.storage_path,
        type: row.type,
        uploaded_by_run: row.uploaded_by_run,
        created_at: row.created_at,
        updated_at: row.updated_at,
        mime_type: row.mime_type ?? null,
        size: row.size ?? null,
      };
    }

    return {
      id: Number(inserted.id),
      dap_id: Number(inserted.dap_id),
      filename: inserted.filename,
      storage_path: inserted.storage_path,
      type: inserted.type,
      uploaded_by_run: inserted.uploaded_by_run ?? null,
      created_at: inserted.created_at ?? new Date(),
      updated_at: inserted.updated_at ?? new Date(),
      mime_type: inserted.mime_type ?? null,
      size: inserted.size ?? null,
    };
  }

  async listByDap(run: number, dapId: number) {
    const rows = (await this.db
      .selectFrom('dap_attachments')
      .selectAll()
      .where('dap_attachments.dap_id', '=', Number(dapId))
      .orderBy('created_at', 'desc')
      .execute()) as any[];

    return rows.map((r: any) => ({
      id: r.id,
      dap_id: r.dap_id,
      filename: r.filename,
      storage_path: r.storage_path,
      type: r.type,
      uploaded_by_run: r.uploaded_by_run,
      created_at: r.created_at,
      updated_at: r.updated_at,
      mime_type: r.mime_type ?? null,
      size: r.size ?? null,
    }));
  }

  async findByIdAndDap(attachmentId: number, dapId: number, run?: number) {
    const row = (await this.db
      .selectFrom('dap_attachments')
      .selectAll()
      .where('id', '=', Number(attachmentId))
      .where('dap_attachments.dap_id', '=', Number(dapId))
      .executeTakeFirst()) as any;

    if (!row) return null;

    if (
      run != null &&
      row.uploaded_by_run != null &&
      Number(row.uploaded_by_run) !== Number(run)
    ) {
      return null;
    }

    return {
      id: row.id,
      dap_id: row.dap_id,
      filename: row.filename,
      storage_path: row.storage_path,
      type: row.type,
      uploaded_by_run: row.uploaded_by_run,
      created_at: row.created_at,
      updated_at: row.updated_at,
      mime_type: row.mime_type ?? null,
      size: row.size ?? null,
    };
  }

  async findById(attachmentId: number) {
    const row = (await this.db
      .selectFrom('dap_attachments')
      .selectAll()
      .where('id', '=', Number(attachmentId))
      .executeTakeFirst()) as any;

    if (!row) return null;
    return {
      id: row.id,
      dap_id: row.dap_id,
      filename: row.filename,
      storage_path: row.storage_path,
      type: row.type,
      uploaded_by_run: row.uploaded_by_run,
      created_at: row.created_at,
      updated_at: row.updated_at,
      mime_type: row.mime_type ?? null,
      size: row.size ?? null,
    };
  }

  async deleteById(attachmentId: number) {
    await this.db
      .deleteFrom('dap_attachments')
      .where('id', '=', Number(attachmentId))
      .execute();
  }

  async lockByDap(run: number, dapId: number) {
    return;
  }
}