import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthGuard } from '@/contexts/shared/guards/auth.guard';
import { User } from '@/contexts/shared/decorators/user.decorator';
import { UserRequest } from '@/utils/interfaces/user-request.interface';

import { DapRepository } from '@/contexts/dap/domain/ports/dap.repository';

@ApiTags('DAP de clientes')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('clients')
export class CollectDapController {
  constructor(private readonly dapRepository: DapRepository) {}

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Marca el DAP como cobro pendiente (EXPIRED-PENDING)',
  })
  @HttpCode(HttpStatus.OK)
  @Post(':run/daps/:dapId/collect')
  async collect(
    @User() user: UserRequest,
    @Param('run', ParseIntPipe) run: number,
    @Param('dapId', ParseIntPipe) dapId: number,
  ): Promise<{ ok: true }> {
    if ((user as any).run !== run) {
      throw new UnauthorizedException('No está autorizado a cobrar este depósito');
    }

    // ✅ Validar que el DAP pertenece al cliente
    const ok = await this.dapRepository.existsByIdAndUserRun(Number(dapId), Number(run));
    if (!ok) {
      throw new BadRequestException('Depósito no encontrado para este cliente');
    }

    // ✅ Cambiar status (el repo valida allowed y normaliza a minúsculas)
    await this.dapRepository.updateStatus(Number(dapId), 'EXPIRED-PENDING', Number(run));

    return { ok: true };
  }
}