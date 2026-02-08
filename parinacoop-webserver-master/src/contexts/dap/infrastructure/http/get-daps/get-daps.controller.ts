import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { GetDapsUseCase } from '@/contexts/dap/application';
import { GetCancelledDapsUseCase } from '@/contexts/dap/application/get-cancelled-daps/get-cancelled-daps.use-case';

import { PrimitiveDap } from '@/contexts/dap/domain/models/Dap';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/contexts/shared/guards/auth.guard';
import { User } from '@/contexts/shared/decorators/user.decorator';
import { UserRequest } from '@/utils/interfaces/user-request.interface';

@ApiTags('DAP de clientes')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('clients')
export class GetDapsController {
  constructor(
    private getDapsUseCase: GetDapsUseCase,
    private getCancelledDapsUseCase: GetCancelledDapsUseCase,
  ) {}

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de los depósitos a plazo del cliente',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No tiene permitido ver los depósitos a plazo de este cliente',
  })
  @Get(':run/daps')
  async run(
    @User() user: UserRequest,
    @Param('run', ParseIntPipe) run: number,
  ): Promise<{ daps: PrimitiveDap[] }> {
    if (user.run !== run) {
      throw new UnauthorizedException(
        'No está autorizado los depósitos a plazo de este cliente',
      );
    }
    return await this.getDapsUseCase.execute({ run });
  }

  // NUEVO: Obtener DAPs CANCELLED para el cliente (pestaña "Historial")
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de los depósitos a plazo cancelados del cliente',
  })
  @Get(':run/daps/cancelled')
  async cancelled(
    @User() user: UserRequest,
    @Param('run', ParseIntPipe) run: number,
  ): Promise<{ daps: PrimitiveDap[] }> {
    if (user.run !== run) {
      throw new UnauthorizedException('No está autorizado a ver estos depósitos');
    }
    return await this.getCancelledDapsUseCase.execute({ run });
  }
}