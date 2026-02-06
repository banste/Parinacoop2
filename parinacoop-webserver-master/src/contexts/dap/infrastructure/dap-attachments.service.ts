import {
  Inject,
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
  Logger,
  Optional,
} from '@nestjs/common';
import { join } from 'path';
import { promises as fsPromises } from 'fs';
import { MailService } from '@/contexts/shared/providers/mail.service';
import { UserRepository } from '@/contexts/admin/domain/ports/user.repository';
import { Role } from '@/contexts/shared/enums/roles.enum';

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
  private readonly logger = new Logger(DapAttachmentsService.name);

  private MAX_RECEIPT = 5 * 1024 * 1024; // 5MB
  private MAX_SIGNED = 10 * 1024 * 1024; // 10MB
  private ALLOWED_RECEIPT_EXT = ['.png', '.jpg', '.jpeg'];
  private ALLOWED_SIGNED_EXT = ['.pdf'];

  constructor(
    @Inject('ATTACHMENTS_REPOSITORY') private readonly attachmentsRepo: any,
    @Optional() private readonly mailService?: MailService,
    @Optional() @Inject('ADMIN_USER_REPOSITORY') private readonly adminUserRepo?: UserRepository,
  ) {
    const repoName = (attachmentsRepo && attachmentsRepo.constructor && attachmentsRepo.constructor.name) || 'unknown';
    this.logger.log(`Attachments repository injected: ${repoName}`);
    this.logger.log(`MailService injected: ${!!this.mailService}`);
    this.logger.log(`AdminUserRepository injected: ${!!this.adminUserRepo}`);
  }

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

  /**
   * Sube el attachment, lo persiste y (opcional) notifica por email a administradores.
   */
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
      this.logger.error('Error creando carpeta de uploads', e as any);
      throw new InternalServerErrorException('No se pudo crear carpeta de uploads');
    }

    // Guardar archivo en disco
    const storageName = `${Date.now()}_${filename.replace(/\s+/g, '_')}`;
    const filePath = join(clientDir, storageName);
    try {
      await fsPromises.writeFile(filePath, buffer);
    } catch (e) {
      this.logger.error('Error escribiendo archivo en disco', e as any);
      throw new InternalServerErrorException('No se pudo guardar el archivo en el servidor');
    }

    const record: any = {
      dap_id: dapId,
      filename,
      storage_path: filePath,
      type,
      uploaded_by_run: run,
      created_at: new Date(),
      mime_type: this.mimeTypeForExt(ext),
      size,
    };

    // Persistir en repo (DB)
    let saved: any = null;
    try {
      saved = await this.attachmentsRepo.createAttachment(record);
      this.logger.log('Attachment saved record: ' + JSON.stringify(saved));
    } catch (err) {
      this.logger.error('Error persisting attachment record to DB', err as any);
      this.logger.debug('Attempted record: ' + JSON.stringify(record));
      // Re-lanzar para que el controlador devuelva 500 (comportamiento actual)
      throw err;
    }

    // Notificación por email a administradores (no bloqueante, errores solo se loguean)
    if (this.mailService) {
      let adminEmails: string[] = [];

      try {
        if (this.adminUserRepo && typeof this.adminUserRepo.getByRole === 'function') {
          const admins = await this.adminUserRepo.getByRole(Role.ADMIN);
          if (Array.isArray(admins) && admins.length > 0) {
            adminEmails = admins
              .map((u: any) => {
                try {
                  if (typeof u.toValue === 'function') {
                    const v = u.toValue();
                    return v?.profile?.email ?? v?.email ?? null;
                  }
                  return u?.profile?.email ?? u?.email ?? null;
                } catch {
                  return null;
                }
              })
              .filter((e: any) => typeof e === 'string' && e.length > 0);
          }
        }

        if (adminEmails.length === 0 && process.env.DAP_ADMIN_EMAILS) {
          adminEmails = process.env.DAP_ADMIN_EMAILS.split(',').map((s) => s.trim()).filter(Boolean);
        }

        if (adminEmails.length > 0) {
          const subject = `[Parinacoop] Nuevo adjunto DAP #${dapId} (cliente ${run})`;
          const html = `
            <p>Se ha subido un nuevo adjunto al DAP <strong>#${dapId}</strong> por el RUN <strong>${run}</strong>.</p>
            <ul>
              <li>Archivo: ${saved.filename}</li>
              <li>Tipo: ${saved.type}</li>
              <li>Tamaño: ${saved.size} bytes</li>
              <li>Almacenado en: ${saved.storage_path}</li>
            </ul>
            <p>Puede descargarlo desde el panel administrativo.</p>
          `;

          const attachments: any[] = [];
          if (saved.storage_path) {
            attachments.push({ filename: saved.filename, path: saved.storage_path });
          }

          try {
            await this.mailService.sendMail({
              to: adminEmails,
              subject,
              html,
              attachments,
            });
            this.logger.log(`Notificación enviada a administradores: ${adminEmails.join(',')}`);
          } catch (mailErr) {
            this.logger.error('Error enviando notificación por mail tras upload', mailErr as any);
          }
        } else {
          this.logger.warn('No hay administradores configurados (DB ni DAP_ADMIN_EMAILS). No se envía notificación.');
        }
      } catch (resolveErr) {
        this.logger.error('Error resolviendo administradores para notificación', resolveErr as any);
      }
    } else {
      this.logger.debug('MailService no disponible; no se enviará notificación tras upload.');
    }

    return saved;
  }

  async listAttachments(run: number, dapId: number) {
    return this.attachmentsRepo.listByDap(run, dapId);
  }

  async getAttachment(run: number, dapId: number, attachmentId: number) {
    if (this.attachmentsRepo && typeof this.attachmentsRepo.findByIdAndDap === 'function') {
      return this.attachmentsRepo.findByIdAndDap(attachmentId, dapId, run);
    }
    const rec = await (this.attachmentsRepo.findById ? this.attachmentsRepo.findById(attachmentId) : null);
    if (!rec) return null;
    if (rec.dap_id !== dapId) return null;
    if (rec.uploaded_by_run != null && rec.uploaded_by_run !== run) return null;
    return rec;
  }

  async lockAttachments(run: number, dapId: number): Promise<void> {
    if (this.attachmentsRepo && typeof this.attachmentsRepo.lockByDap === 'function') {
      await this.attachmentsRepo.lockByDap(run, dapId);
    } else {
      this.logger.debug(`lockAttachments noop (repo has no lock). run=${run} dapId=${dapId}`);
    }
  }

  async deleteAttachment(attachmentIdOrRun: number, dapId?: number, attachmentId?: number) {
    if (dapId !== undefined && attachmentId !== undefined) {
      const run = attachmentIdOrRun;
      const aId = attachmentId;

      let rec = null;
      if (this.attachmentsRepo && typeof this.attachmentsRepo.findByIdAndDap === 'function') {
        rec = await this.attachmentsRepo.findByIdAndDap(aId, dapId, run);
      } else if (this.attachmentsRepo && typeof this.attachmentsRepo.findById === 'function') {
        rec = await this.attachmentsRepo.findById(aId);
        if (rec && rec.dap_id !== dapId) rec = null;
        if (rec && rec.uploaded_by_run != null && rec.uploaded_by_run !== run) rec = null;
      } else {
        const list = await this.attachmentsRepo.listByDap(run, dapId).catch(() => []);
        rec = (list || []).find((r: any) => Number(r.id) === Number(aId)) ?? null;
      }

      if (!rec) throw new NotFoundException('Adjunto no encontrado');

      await this.attachmentsRepo.deleteById(aId);

      try {
        if (rec.storage_path) {
          await fsPromises.unlink(rec.storage_path).catch(() => {});
        }
      } catch (e) {
        this.logger.debug('Error borrando archivo físico tras eliminar attachment:', e as any);
      }
      return;
    }

    // deleteAttachment(attachmentId)
    const aId = attachmentIdOrRun;
    const existing = await (this.attachmentsRepo.findById ? this.attachmentsRepo.findById(aId) : null);
    if (!existing) throw new NotFoundException('Adjunto no encontrado');
    await this.attachmentsRepo.deleteById(aId);
    try {
      if (existing.storage_path) {
        await fsPromises.unlink(existing.storage_path).catch(() => {});
      }
    } catch (e) {
      this.logger.debug('Error borrando archivo físico tras eliminar attachment:', e as any);
    }
    return;
  }
}