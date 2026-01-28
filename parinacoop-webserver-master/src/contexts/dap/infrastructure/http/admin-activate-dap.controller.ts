import { Body, Controller, HttpStatus, Post, UseGuards, BadRequestException, NotFoundException, InternalServerErrorException, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Roles } from '@/contexts/shared/decorators/roles.decorator';
import { RolesGuard } from '@/contexts/shared/guards/roles.guard';
import { AuthGuard } from '@/contexts/shared/guards/auth.guard';
import { Role } from '@/contexts/shared/enums/roles.enum';

import { DapRepository } from '@/contexts/dap/domain/ports/dap.repository';

@ApiTags('DAP Admin (activate)')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@UseGuards(AuthGuard, RolesGuard)
@Controller('admin/daps')
export class AdminActivateDapController {
  constructor(private readonly dapRepo: DapRepository) {}

  @ApiResponse({ status: HttpStatus.OK, description: 'Activar DAP por internalId (y opcionalmente asociarlo a dapId)' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'internalId requerido' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'DAP no encontrado con esa internalId' })
  @Post('activate')
  async activateByInternalId(
    @Body() body: { internalId?: string; dapId?: number },
    @Req() req: Request,
  ) {
    const internalId = (body?.internalId ?? '').toString().trim();
    const dapIdFromBody = body?.dapId ?? null;

    console.log('AdminActivateDapController.activateByInternalId called, body=', { internalId, dapIdFromBody });

    if (!internalId) throw new BadRequestException('internalId requerido');

    // Determinar el run/admin que realiza la acción si está disponible en req.user
    const user = (req as any).user ?? null;
    const createdByRun = (user?.run ?? user?.rut ?? user?.id) ?? null;

    // Si viene dapId, primero asociamos (insert/update) el internalId al dap
    if (dapIdFromBody) {
      try {
        if (typeof (this.dapRepo as any).attachInternalId === 'function') {
          await (this.dapRepo as any).attachInternalId(dapIdFromBody, internalId, createdByRun ?? 0);
          console.log('attachInternalId OK', { dapId: dapIdFromBody, internalId, createdByRun });
        } else {
          throw new Error('Repositorio no implementa attachInternalId');
        }
      } catch (err) {
        console.error('Error associating internalId:', err);
        throw new InternalServerErrorException('Error asociando internalId al DAP: ' + (err as any)?.message);
      }

      // Luego actualizamos status usando updateStatusById
      if (typeof (this.dapRepo as any).updateStatusById === 'function') {
        const updated = await (this.dapRepo as any).updateStatusById(dapIdFromBody, 'ACTIVE');
        if (!updated) throw new InternalServerErrorException('No se pudo actualizar estado del DAP');
        return { ok: true, message: 'DAP activado y internalId asociado', dapId: dapIdFromBody };
      }

      throw new InternalServerErrorException('Repositorio no implementa updateStatusById');
    }

    // Si no viene dapId, intentamos buscar por internalId
    const dap = await (this.dapRepo as any).findByInternalId?.(internalId);
    console.log('findByInternalId result:', dap ? { id: (dap as any).id } : null);
    if (!dap) throw new NotFoundException('DAP no encontrado para el internalId');

    const id = (dap as any).id;
    if (!id) throw new InternalServerErrorException('DAP encontrado sin id');

    if (typeof (this.dapRepo as any).updateStatusById === 'function') {
      const updated = await (this.dapRepo as any).updateStatusById(id, 'ACTIVE');
      if (!updated) throw new InternalServerErrorException('No se pudo actualizar estado del DAP');
      return { ok: true, message: 'DAP activado', dapId: id };
    }

    throw new InternalServerErrorException('Repositorio no implementa updateStatusById');
  }
}