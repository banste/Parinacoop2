import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DapRepository } from '../domain/ports/dap.repository';
import { DapAttachmentsRepository } from './repositories/dap-attachments.repository';

@Injectable()
export class DapAttachmentsService {
  private readonly UPLOAD_ROOT = path.join(process.cwd(), 'uploads', 'dap');
  private readonly MAX_BYTES_RECEIPT = 5 * 1024 * 1024; // 5 MB
  private readonly MAX_BYTES_SIGNED = 10 * 1024 * 1024; // 10 MB

  constructor(
    private readonly dapRepository: DapRepository,
    private readonly attachmentsRepo: DapAttachmentsRepository,
  ) {}

  private async ensureDir(dir: string) {
    await fs.mkdir(dir, { recursive: true });
  }

  private sanitizeFilename(name: string) {
    return name.replace(/[^a-zA-Z0-9.\-_ ]/g, '_').slice(0, 200);
  }

  private isPdfBuffer(buf: Buffer): boolean {
    return buf.slice(0, 4).toString() === '%PDF';
  }

  private isJpegBuffer(buf: Buffer): boolean {
    return buf.length > 2 && buf[0] === 0xff && buf[1] === 0xd8;
  }

  private isPngBuffer(buf: Buffer): boolean {
    return buf.length > 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  }

  async uploadAttachment(run: number, dapId: number, filename: string, base64: string, type: 'receipt' | 'signed_document') {
    const dapEntity = await this.dapRepository.findByIdAndUserRun(dapId, run);
    if (!dapEntity) throw new NotFoundException('DAP no encontrado o no autorizado');

    const buffer = Buffer.from(base64, 'base64');
    if (buffer.byteLength === 0) throw new BadRequestException('Archivo vacío');

    if (type === 'receipt') {
      if (buffer.byteLength > this.MAX_BYTES_RECEIPT) throw new BadRequestException('Comprobante excede tamaño permitido (5 MB)');
      if (!(this.isJpegBuffer(buffer) || this.isPngBuffer(buffer))) throw new BadRequestException('El comprobante debe ser imagen JPEG o PNG');
    } else {
      if (buffer.byteLength > this.MAX_BYTES_SIGNED) throw new BadRequestException('Documento excede tamaño permitido (10 MB)');
      if (!this.isPdfBuffer(buffer)) throw new BadRequestException('El documento firmado debe ser PDF');
    }

    const safeName = this.sanitizeFilename(filename);
    const timestamp = Date.now();
    const subdir = path.join(this.UPLOAD_ROOT, String(dapId), 'attachments');
    await this.ensureDir(subdir);

    const storageName = `${timestamp}-${safeName}`;
    const storagePath = path.join(subdir, storageName);

    await fs.writeFile(storagePath, buffer, { mode: 0o600 });

    const record = await this.attachmentsRepo.create({
      dap_id: dapId,
      type,
      filename,
      storage_path: storagePath,
      uploaded_by_run: run,
    });

    return record;
  }

  async listAttachments(run: number, dapId: number) {
    const dapEntity = await this.dapRepository.findByIdAndUserRun(dapId, run);
    if (!dapEntity) throw new NotFoundException('DAP no encontrado o no autorizado');

    return this.attachmentsRepo.findByDap(dapId);
  }

  async getAttachment(run: number, dapId: number, attachmentId: number) {
    const rec = await this.attachmentsRepo.findById(attachmentId);
    if (!rec) throw new NotFoundException('Adjunto no encontrado');
    if (rec.dap_id !== dapId) throw new NotFoundException('Adjunto no pertenece a este DAP');

    const dapEntity = await this.dapRepository.findByIdAndUserRun(dapId, run);
    if (!dapEntity) throw new ForbiddenException('No autorizado');

    return rec;
  }

  async deleteAttachment(run: number, dapId: number, attachmentId: number) {
    const rec = await this.attachmentsRepo.findById(attachmentId);
    if (!rec) throw new NotFoundException('Adjunto no encontrado');
    if (rec.dap_id !== dapId) throw new NotFoundException('Adjunto no pertenece a este DAP');

    const dapEntity = await this.dapRepository.findByIdAndUserRun(dapId, run);
    if (!dapEntity) throw new ForbiddenException('No autorizado');

    await fs.unlink(rec.storage_path).catch(() => {});
    await this.attachmentsRepo.deleteById(attachmentId);
  }
}