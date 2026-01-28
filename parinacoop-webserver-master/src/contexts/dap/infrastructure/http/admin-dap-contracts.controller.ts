import { Controller, Get, HttpStatus, Param, ParseIntPipe, UseGuards, NotFoundException, HttpCode, Res, StreamableFile } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@/contexts/shared/guards/auth.guard';
import { Roles } from '@/contexts/shared/decorators/roles.decorator';
import { RolesGuard } from '@/contexts/shared/guards/roles.guard';
import { Role } from '@/contexts/shared/enums/roles.enum';

import { DapContractsService } from '../dap-contracts.service';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';

@ApiTags('DAP Contracts (admin)')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@UseGuards(AuthGuard, RolesGuard)
@Controller('admin/clients')
export class AdminDapContractsController {
  constructor(private readonly contractsService: DapContractsService) {}

  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de contracts (admin)' })
  @HttpCode(HttpStatus.OK)
  @Get(':run/daps/:dapId/contracts')
  async list(
    @Param('run', ParseIntPipe) run: number,
    @Param('dapId', ParseIntPipe) dapId: number,
  ) {
    return this.contractsService.listContracts(run, dapId);
  }

  @ApiResponse({ status: HttpStatus.OK, description: 'Descargar contract (admin)' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Contrato no encontrado' })
  @Get(':run/daps/:dapId/contracts/:contractId/download')
  async download(
    @Param('run', ParseIntPipe) run: number,
    @Param('dapId', ParseIntPipe) dapId: number,
    @Param('contractId', ParseIntPipe) contractId: number,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<StreamableFile> {
    const rec = await this.contractsService.getContract(run, dapId, contractId);
    if (!rec) throw new NotFoundException('Contrato no encontrado');

    // rec.storage_path puede ser absoluto o relativo; adaptamos al mismo patrón usado en attachments
    const uploadsRoot = process.env.UPLOADS_ROOT ?? join(process.cwd(), 'uploads');
    const filePath =
      (rec as any).storage_path && (rec as any).storage_path.startsWith('/')
        ? (rec as any).storage_path
        : join(uploadsRoot, (rec as any).storage_path ?? rec.filename);

    if (!existsSync(filePath)) {
      throw new NotFoundException('Archivo físico no encontrado en el servidor');
    }

    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `attachment; filename="${encodeURIComponent(rec.filename ?? 'contract.pdf')}"`);

    const stream = createReadStream(filePath);
    return new StreamableFile(stream);
  }
}