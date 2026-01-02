import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  ParseIntPipe,
  Body,
  Res,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { Response } from 'express';
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
    const rec = await this.attachmentsService.uploadAttachment(run, dapId, body.filename, body.contentBase64, body.type);
    return { id: rec.id, filename: rec.filename, type: rec.type, created_at: rec.created_at };
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
    @Res() res: Response,
  ) {
    if (Number(user.run) !== run) throw new ForbiddenException();
    const rec = await this.attachmentsService.getAttachment(run, dapId, attachmentId);
    return res
      .header('Content-Type', rec.type === 'receipt' ? 'image/*' : 'application/pdf')
      .header('Content-Disposition', `attachment; filename="${rec.filename}"`)
      .sendFile(rec.storage_path, { root: '/' } as any);
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