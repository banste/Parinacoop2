import {
  Controller,
  Put,
  Param,
  ParseIntPipe,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/contexts/shared/guards/auth.guard';
import { Roles } from '@/contexts/shared/decorators/roles.decorator';
import { RolesGuard } from '@/contexts/shared/guards/roles.guard';
import { Role } from '@/contexts/shared/enums/roles.enum';
import { DapRepository } from '@/contexts/dap/domain/ports/dap.repository';
import { UpdateDapStatusDto } from '../../dto/update-dap-status.dto';

@ApiTags('DAP Admin (status)')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@UseGuards(AuthGuard, RolesGuard)
@Controller('admin/clients')
export class AdminUpdateDapStatusController {
  constructor(private readonly dapRepo: DapRepository) {}

  @ApiResponse({ status: HttpStatus.OK, description: 'Actualiza el status de un DAP (admin)' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'DAP no encontrado' })
  @HttpCode(HttpStatus.OK)
  @Put(':run/daps/:dapId/status')
  async updateStatus(
    @Param('run', ParseIntPipe) run: number,
    @Param('dapId', ParseIntPipe) dapId: number,
    @Body() dto: UpdateDapStatusDto,
  ) {
    // Opcional: puedes chequear que el DAP pertenece al run indicado (si quisieras)
    try {
      const updated = await (this.dapRepo as any).updateStatusById(dapId, dto.status);
      if (!updated) {
        throw new NotFoundException('DAP no encontrado o no actualizado');
      }
      return { ok: true, dapId, status: dto.status };
    } catch (err) {
      // Si updateStatusById lanza algo inesperado, devolvemos 500
      throw new InternalServerErrorException('Error actualizando estado: ' + (err as any)?.message);
    }
  }
}