import { Controller, Get, HttpStatus, Param, ParseIntPipe, UseGuards, NotFoundException, HttpCode, Res, StreamableFile } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@/contexts/shared/guards/auth.guard';
import { Roles } from '@/contexts/shared/decorators/roles.decorator';
import { RolesGuard } from '@/contexts/shared/guards/roles.guard';
import { Role } from '@/contexts/shared/enums/roles.enum';

import { DapAttachmentsService } from '../dap-attachments.service';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';

@ApiTags('DAP Attachments (admin)')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@UseGuards(AuthGuard, RolesGuard)
@Controller('admin/clients')
export class AdminDapAttachmentsController {
  constructor(private readonly attachmentsService: DapAttachmentsService) {}

  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de attachments (admin)' })
  @HttpCode(HttpStatus.OK)
  @Get(':run/daps/:dapId/attachments')
  async list(
    @Param('run', ParseIntPipe) run: number,
    @Param('dapId', ParseIntPipe) dapId: number,
  ) {
    return this.attachmentsService.listAttachments(run, dapId);
  }

  @ApiResponse({ status: HttpStatus.OK, description: 'Descargar attachment (admin)' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Adjunto no encontrado' })
  @Get(':run/daps/:dapId/attachments/:attachmentId/download')
  async download(
    @Param('run', ParseIntPipe) run: number,
    @Param('dapId', ParseIntPipe) dapId: number,
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<StreamableFile> {
    const rec = await this.attachmentsService.getAttachment(run, dapId, attachmentId);
    if (!rec) throw new NotFoundException('Adjunto no encontrado');

    const uploadsRoot = process.env.UPLOADS_ROOT ?? join(process.cwd(), 'uploads');
    const filePath =
      (rec as any).storage_path && (rec as any).storage_path.startsWith('/')
        ? (rec as any).storage_path
        : join(uploadsRoot, (rec as any).storage_path ?? rec.filename);

    if (!existsSync(filePath)) {
      throw new NotFoundException('Archivo físico no encontrado en el servidor');
    }

    const mimeType = (rec as any).mime_type ?? 'application/octet-stream';
    reply.header('Content-Type', mimeType);
    reply.header('Content-Disposition', `attachment; filename="${encodeURIComponent(rec.filename ?? 'file')}"`);

    const stream = createReadStream(filePath);
    return new StreamableFile(stream);
  }
}