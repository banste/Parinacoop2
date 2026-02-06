import { Injectable, Inject } from '@nestjs/common';
import { Database } from '@/database/database';
import { sql } from 'kysely';

/**
 * Postgres-backed attachments repository (implementa la API esperada por DapAttachmentsService).
 *
 * Métodos:
 * - createAttachment(data)
 * - listByDap(run, dapId)
 * - findByIdAndDap(attachmentId, dapId, run?)
 * - findById(attachmentId)
 * - deleteById(attachmentId)
 * - lockByDap(run, dapId)  // noop por defecto
 *
 * NOTA: usamos casts a `any` en los resultados de Kysely para evitar problemas
 * de tipado mientras actualizas la interfaz Database. Recomiendo actualizar
 * la interface Database para incluir la tabla dap_attachments.
 */
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
    };

    // Agregar metadata opcional sólo si viene
    if (data.mime_type !== undefined) row.mime_type = data.mime_type;
    if (data.size !== undefined) row.size = data.size;

    const inserted = (await this.db
      .insertInto('dap_attachments')
      .values(row)
      .returningAll()
      .executeTakeFirst()) as any;

    if (!inserted) {
      // en caso raro, devolver el objeto original con id null
      return {
        id: null,
        dap_id: row.dap_id,
        filename: row.filename,
        storage_path: row.storage_path,
        type: row.type,
        uploaded_by_run: row.uploaded_by_run,
        created_at: row.created_at,
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

    // Si se provee run, validar que coincida (si la columna uploaded_by_run está poblada)
    if (run != null && row.uploaded_by_run != null && Number(row.uploaded_by_run) !== Number(run)) {
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
      mime_type: row.mime_type ?? null,
      size: row.size ?? null,
    };
  }

  async deleteById(attachmentId: number) {
    await this.db.deleteFrom('dap_attachments').where('id', '=', Number(attachmentId)).execute();
  }

  // noop por defecto; implementar si quieres marcar daps como 'attachments_locked'
  async lockByDap(run: number, dapId: number) {
    // ejemplo (comentado): await this.db.updateTable('dap').set({ attachments_locked: true }).where('id', '=', dapId).execute();
    return;
  }
}