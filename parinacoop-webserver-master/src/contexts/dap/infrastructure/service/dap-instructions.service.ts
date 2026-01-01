import { Inject, Injectable, InternalServerErrorException, BadRequestException, NotFoundException } from '@nestjs/common';
import { join } from 'path';
import { promises as fsPromises, existsSync, statSync } from 'fs';

export interface AttachmentRecord {
  id: number;
  dap_id: number;
  filename: string;
  storage_path?: string;
  type?: string;
  uploaded_by_run?: number;
  created_at?: Date;
  mime_type?: string;
  size?: number;
}

@Injectable()
export class DapAttachmentsService {
  private MAX_RECEIPT = 5 * 1024 * 1024; // 5MB
  private MAX_SIGNED = 10 * 1024 * 1024; // 10MB
  private ALLOWED_RECEIPT_EXT = ['.png', '.jpg', '.jpeg'];
  private ALLOWED_SIGNED_EXT = ['.pdf'];

  constructor(
    @Inject('ATTACHMENTS_REPOSITORY') private readonly attachmentsRepo: any, // repo must expose createAttachment, listByDap, findByIdAndDap, deleteById
  ) {}

  private getUploadsRoot(): string {
    return process.env.UPLOADS_ROOT ?? join(process.cwd(), 'uploads');
  }

  private getExtension(filename: string): string {
    const idx = filename.lastIndexOf('.');
    return idx >= 0 ? filename.slice(idx).toLowerCase() : '';
  }

  private bufferFromBase64(base64: string): Buffer {
    const idx = base64.indexOf(';base64,');
    const raw = idx >= 0 ? base64.slice(idx + ';base64,'.length) : base64;
    const cleaned = raw.replace(/\s/g, '');
    return Buffer.from(cleaned, 'base64');
  }

  private mimeTypeForExt(ext: string): string {
    const map: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.pdf': 'application/pdf',
    };
    return map[ext] ?? 'application/octet-stream';
  }

  async uploadAttachment(
    run: number,
    dapId: number,
    filename: string,
    contentBase64: string,
    type: 'receipt' | 'signed_document',
  ): Promise<AttachmentRecord> {
    if (!filename || !contentBase64) {
      throw new BadRequestException('filename y contentBase64 son requeridos');
    }

    const ext = this.getExtension(filename);
    if (type === 'receipt' && !this.ALLOWED_RECEIPT_EXT.includes(ext)) {
      throw new BadRequestException(`Formato inválido para comprobante. Permitidos: ${this.ALLOWED_RECEIPT_EXT.join(', ')}`);
    }
    if (type === 'signed_document' && !this.ALLOWED_SIGNED_EXT.includes(ext)) {
      throw new BadRequestException(`Formato inválido para documento firmado. Permitidos: ${this.ALLOWED_SIGNED_EXT.join(', ')}`);
    }

    let buffer: Buffer;
    try {
      buffer = this.bufferFromBase64(contentBase64);
    } catch (e) {
      throw new BadRequestException('Contenido base64 inválido');
    }
    const size = buffer.length;
    if (type === 'receipt' && size > this.MAX_RECEIPT) throw new BadRequestException('El comprobante excede 5MB');
    if (type === 'signed_document' && size > this.MAX_SIGNED) throw new BadRequestException('El documento excede 10MB');

    const uploadsRoot = this.getUploadsRoot();
    const clientDir = join(uploadsRoot, `client_${run}`, `dap_${dapId}`);
    try {
      await fsPromises.mkdir(clientDir, { recursive: true });
    } catch (e) {
      throw new InternalServerErrorException('No se pudo crear carpeta de uploads');
    }

    const safeName = filename.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    const targetName = `${Date.now()}_${safeName}`;
    const targetPathAbsolute = join(clientDir, targetName);

    try {
      await fsPromises.writeFile(targetPathAbsolute, buffer);
    } catch (e) {
      throw new InternalServerErrorException('Error guardando archivo en disco');
    }

    const storageRelative = targetPathAbsolute.startsWith(uploadsRoot)
      ? targetPathAbsolute.slice(uploadsRoot.length).replace(/^[/\\]/, '')
      : targetPathAbsolute;

    const recToCreate: Partial<AttachmentRecord> = {
      dap_id: dapId,
      filename,
      storage_path: storageRelative,
      type,
      uploaded_by_run: run,
      created_at: new Date(),
      mime_type: type === 'receipt' ? this.mimeTypeForExt(ext) : 'application/pdf',
      size,
    };

    let saved: any = null;
    try {
      if (!this.attachmentsRepo || typeof this.attachmentsRepo.createAttachment !== 'function') {
        // fallback simple if repo not provided
        saved = {
          id: Date.now(),
          ...(recToCreate as any),
        };
      } else {
        saved = await this.attachmentsRepo.createAttachment(recToCreate);
      }
    } catch (e) {
      // cleanup file on failure
      try {
        if (existsSync(targetPathAbsolute)) await fsPromises.unlink(targetPathAbsolute);
      } catch {}
      throw new InternalServerErrorException('Error persistiendo registro del attachment');
    }

    return saved as AttachmentRecord;
  }

  async listAttachments(run: number, dapId: number): Promise<AttachmentRecord[]> {
    if (!this.attachmentsRepo || typeof this.attachmentsRepo.listByDap !== 'function') return [];
    return this.attachmentsRepo.listByDap(run, dapId);
  }

  async getAttachment(run: number, dapId: number, attachmentId: number): Promise<AttachmentRecord | null> {
    if (!this.attachmentsRepo || typeof this.attachmentsRepo.findByIdAndDap !== 'function') return null;
    const rec = await this.attachmentsRepo.findByIdAndDap(attachmentId, dapId, run);
    return rec ?? null;
  }

  async getAttachmentFileInfo(run: number, dapId: number, attachmentId: number) {
    const rec = await this.getAttachment(run, dapId, attachmentId);
    if (!rec) return null;
    const uploadsRoot = this.getUploadsRoot();
    const filePath = (rec as any).storage_path && (rec as any).storage_path.startsWith('/')
      ? (rec as any).storage_path
      : join(uploadsRoot, (rec as any).storage_path ?? rec.filename);
    const exists = existsSync(filePath);
    const fileSize = exists ? statSync(filePath).size : 0;
    return {
      filePath,
      filename: rec.filename,
      mimeType: rec.mime_type,
      size: fileSize,
      record: rec,
    };
  }

  async deleteAttachment(run: number, dapId: number, attachmentId: number): Promise<void> {
    const rec = await this.getAttachment(run, dapId, attachmentId);
    if (!rec) throw new NotFoundException('Attachment not found');

    const uploadsRoot = this.getUploadsRoot();
    const filePath = (rec as any).storage_path && (rec as any).storage_path.startsWith('/')
      ? (rec as any).storage_path
      : join(uploadsRoot, (rec as any).storage_path ?? rec.filename);

    if (this.attachmentsRepo && typeof this.attachmentsRepo.deleteById === 'function') {
      await this.attachmentsRepo.deleteById(attachmentId);
    }

    try {
      if (existsSync(filePath)) await fsPromises.unlink(filePath);
    } catch (e) {
      // ignore deletion error
    }
  }

  // Optional server-side lock method: implement if your DAP repository supports it.
  async lockAttachments(run: number, dapId: number): Promise<void> {
    // implement update on dap record to set attachments_locked = true if desired
    // if not implemented, this method is a no-op (controller calls it safely)
    return;
  }
}