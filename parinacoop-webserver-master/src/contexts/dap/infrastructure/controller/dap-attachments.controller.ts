import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  ParseIntPipe,
  Body,
  Res,
  UseGuards,
  ForbiddenException,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import { FastifyReply } from 'fastify';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuthGuard } from '@/contexts/shared/guards/auth.guard';
import { User } from '@/contexts/shared/decorators/user.decorator';
import { UserRequest } from '@/utils/interfaces/user-request.interface';
import { DapAttachmentsService } from '../dap-attachments.service';

@ApiTags('DAP Attachments')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('clients/:run/daps/:dapId/attachments')
export class DapAttachmentsController {
  constructor(private readonly attachmentsService: DapAttachmentsService) {}

  @Post()
  async upload(
    @User() user: UserRequest,
    @Param('run', ParseIntPipe) run: number,
    @Param('dapId', ParseIntPipe) dapId: number,
    @Body() body: { filename: string; contentBase64: string; type: 'receipt' | 'signed_document' },
  ) {
    if (Number(user.run) !== run) throw new ForbiddenException();

    // DEBUG: log incoming request
    console.debug('UPLOAD request from user.run=', user.run, 'route run=', run, 'dapId=', dapId);
    console.debug('UPLOAD body keys:', Object.keys(body ?? {}));
    if (typeof body?.contentBase64 === 'string') {
      console.debug('UPLOAD body contentBase64 (first 200 chars) =', body.contentBase64.slice(0, 200));
    } else {
      console.debug('UPLOAD contentBase64 type:', typeof body?.contentBase64);
    }

    const rec = await this.attachmentsService.uploadAttachment(run, dapId, body.filename, body.contentBase64, body.type);

    // DEBUG: log saved record
    console.debug('Attachment saved record:', rec);

    // Return useful data to frontend (including storage_path for debugging)
    return {
      id: rec.id,
      filename: rec.filename,
      type: rec.type,
      created_at: rec.created_at,
      storage_path: (rec as any).storage_path ?? null,
    };
  }

  @Get()
  async list(
    @User() user: UserRequest,
    @Param('run', ParseIntPipe) run: number,
    @Param('dapId', ParseIntPipe) dapId: number,
  ) {
    if (Number(user.run) !== run) throw new ForbiddenException();
    return this.attachmentsService.listAttachments(run, dapId);
  }

  @Get(':attachmentId/download')
  async download(
    @User() user: UserRequest,
    @Param('run', ParseIntPipe) run: number,
    @Param('dapId', ParseIntPipe) dapId: number,
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<StreamableFile> {
    if (Number(user.run) !== run) throw new ForbiddenException();

    const rec = await this.attachmentsService.getAttachment(run, dapId, attachmentId);
    if (!rec) throw new NotFoundException('Adjunto no encontrado');

    const uploadsRoot = process.env.UPLOADS_ROOT ?? join(process.cwd(), 'uploads');
    const filePath = (rec as any).storage_path && (rec as any).storage_path.startsWith('/')
      ? (rec as any).storage_path
      : join(uploadsRoot, (rec as any).storage_path ?? rec.filename);

    if (!existsSync(filePath)) {
      console.debug('Download: filePath not found', filePath);
      throw new NotFoundException('Archivo físicamente no encontrado en el servidor');
    }

    const mimeType =
      (rec as any).mime_type ??
      (rec as any).content_type ??
      (rec as any).type === 'receipt'
        ? 'image/png'
        : (rec as any).type === 'signed_document'
        ? 'application/pdf'
        : 'application/octet-stream';

    reply.header('Content-Type', mimeType);
    reply.header('Content-Disposition', `attachment; filename="${encodeURIComponent(rec.filename ?? 'file')}"`);

    const stream = createReadStream(filePath);
    return new StreamableFile(stream);
  }

  // Optional route so front-end PATCH /.../attachments/lock won't 404
  @Patch('lock')
  async lockAttachments(
    @User() user: UserRequest,
    @Param('run', ParseIntPipe) run: number,
    @Param('dapId', ParseIntPipe) dapId: number,
  ) {
    if (Number(user.run) !== run) throw new ForbiddenException();
    await this.attachmentsService.lockAttachments?.(run, dapId);
    return { ok: true };
  }

  @Delete(':attachmentId')
  async delete(
    @User() user: UserRequest,
    @Param('run', ParseIntPipe) run: number,
    @Param('dapId', ParseIntPipe) dapId: number,
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
  ) {
    if (Number(user.run) !== run) throw new ForbiddenException();
    await this.attachmentsService.deleteAttachment(run, dapId, attachmentId);
    return { ok: true };
  }
}