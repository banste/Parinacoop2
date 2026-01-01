import { Injectable } from '@nestjs/common';
import { promises as fsPromises } from 'fs';
import { join } from 'path';

/**
 * Simple attachments repository for development.
 * Replace with your real DB repository implementation.
 */
@Injectable()
export class DapAttachmentsRepository {
  private store: any[] = [];
  private nextId = 1;

  async createAttachment(data: any) {
    const id = this.nextId++;
    const row = {
      id,
      dap_id: data.dap_id,
      filename: data.filename,
      storage_path: data.storage_path,
      type: data.type,
      uploaded_by_run: data.uploaded_by_run,
      created_at: data.created_at ?? new Date(),
      mime_type: data.mime_type,
      size: data.size,
    };
    this.store.push(row);
    return row;
  }

  async listByDap(run: number, dapId: number) {
    return this.store.filter((r) => r.dap_id === dapId && (run == null || r.uploaded_by_run === run));
  }

  async findByIdAndDap(attachmentId: number, dapId: number, run: number) {
    const r = this.store.find((s) => s.id === attachmentId) ?? null;
    if (!r) return null;
    if (r.dap_id !== dapId) return null;
    if (run != null && r.uploaded_by_run !== run) return null;
    return r;
  }

  async deleteById(attachmentId: number) {
    this.store = this.store.filter((r) => r.id !== attachmentId);
  }
}