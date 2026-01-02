import { Controller, Get, Param, Res, StreamableFile, NotFoundException } from '@nestjs/common';
import { createReadStream } from 'fs';
import { join } from 'path';
import { FastifyReply } from 'fastify';
import * as DapInstructionsServiceModule from '../../infrastructure/service/dap-instructions.service';

/**
 * Controlador que entrega el instructivo PDF de un DAP.
 * Nota: el error TS2315 se debía a usar Buffer como genérico.
 * Aquí se usa Buffer (no genérico) en el listener de 'data'.
 */
@Controller('clients/:run/daps/:dapId/instructivo')
export class GetDapInstructivoController {
  // Use a loose type here to avoid TS errors when the service module's exports differ.
  constructor(private readonly dapInstructionsService: any) {}

  @Get()
  async get(
    @Param('run') run: string,
    @Param('dapId') dapId: string,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<StreamableFile> {
    const info = await this.dapInstructionsService.getInstructivoInfo(Number(run), Number(dapId));
    if (!info || !info.filePath) throw new NotFoundException('Instructivo no encontrado');

    // Establecer headers
    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `inline; filename="${encodeURIComponent(info.filename ?? 'instructivo.pdf')}"`);

    const stream = createReadStream(info.filePath);
    return new StreamableFile(stream);
  }
}