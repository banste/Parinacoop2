import { Controller, Post, Body, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/contexts/shared/guards/auth.guard';
import { Roles } from '@/contexts/shared/decorators/roles.decorator';
import { Role } from '@/contexts/shared/enums/roles.enum';
import { RolesGuard } from '@/contexts/shared/guards/roles.guard';
import { User } from '@/contexts/shared/decorators/user.decorator';
import { UserRequest } from '@/utils/interfaces/user-request.interface';
import { DapRepository } from '../../domain/ports/dap.repository';
import { DapStatus } from '@/contexts/dap/domain/dap-status.enum';

@ApiTags('DAP (admin)')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@UseGuards(AuthGuard, RolesGuard)
@Controller('admin/daps')
export class AdminActivateDapController {
  constructor(private readonly dapRepository: DapRepository) {}

  @Post('activate')
  async activateByInternalId(
    @User() user: UserRequest,
    @Body() body: { internalId?: string },
  ) {
    if (!body?.internalId) throw new BadRequestException('internalId requerido');

    const internalId = String(body.internalId).trim();
    if (!internalId) throw new BadRequestException('internalId inválido');

    // Buscar DAP por internal_id: este método debe implementarse en el repo
    const dap = await (this.dapRepository as any).findByInternalId?.(internalId);
    if (!dap) throw new NotFoundException('DAP no encontrado para ese internalId');

    // Si está pendiente, pasar a active (o forzar siempre)
    if ((dap.status ?? '').toString() === DapStatus.ACTIVE) {
      return { ok: true, message: 'El depósito ya está activo', dap };
    }

    const updated = await (this.dapRepository as any).updateStatusById?.(dap.id, DapStatus.ACTIVE);
    if (!updated) throw new BadRequestException('No se pudo actualizar el estado del DAP');

    // Registrar auditoría: insertar en dap_internal_ids que ya creaste en migración
    if ((this.dapRepository as any).attachInternalId) {
      try {
        await (this.dapRepository as any).attachInternalId(dap.id, internalId, Number(user.run));
      } catch (err) {
        // no fatal: log y continuar
        console.warn('attachInternalId falló', err);
      }
    }

    return { ok: true, message: 'DAP activado', dap: updated };
  }
}