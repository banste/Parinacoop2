import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';

import { GetDapsUseCase } from '@/contexts/dap/application';
import { Roles } from '@/contexts/shared/decorators/roles.decorator';
import { Role } from '@/contexts/shared/enums/roles.enum';
import { AuthGuard } from '@/contexts/shared/guards/auth.guard';
import { RolesGuard } from '@/contexts/shared/guards/roles.guard';

@ApiTags('DAP (admin)')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@UseGuards(AuthGuard, RolesGuard)
@Controller('admin/clients')
export class AdminGetDapsController {
  constructor(private readonly getDapsUseCase: GetDapsUseCase) {}

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de los depósitos a plazo del cliente (admin)',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No autorizado',
  })
  @HttpCode(HttpStatus.OK)
  @Get(':run/daps')
  async getByClientRun(
    @Param('run', ParseIntPipe) run: number,
  ): Promise<{ daps: any[] }> {
    // Reusar el caso de uso que ya normaliza/convierte las entidades
    return await this.getDapsUseCase.execute({ run });
  }
}