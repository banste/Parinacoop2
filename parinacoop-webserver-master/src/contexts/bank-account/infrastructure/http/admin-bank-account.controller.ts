import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthGuard } from '@/contexts/shared/guards/auth.guard';
import { Roles } from '@/contexts/shared/decorators/roles.decorator';
import { RolesGuard } from '@/contexts/shared/guards/roles.guard';
import { Role } from '@/contexts/shared/enums/roles.enum';

import { ClientRepository } from '@/contexts/client-profile/domain/ports/client.repository';
import { MySqlClientBankAccountRepository } from '../repositories/mysql.client-bank-account.repository';

@ApiTags('Bank Account (admin)')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@UseGuards(AuthGuard, RolesGuard)
@Controller('admin/clients')
export class AdminBankAccountController {
  constructor(
    private readonly repo: MySqlClientBankAccountRepository,
    private readonly clientRepository: ClientRepository,
  ) {}

  @ApiResponse({ status: HttpStatus.OK, description: 'Cuenta bancaria del cliente (admin)' })
  @HttpCode(HttpStatus.OK)
  @Get(':run/bank-account')
  async get(@Param('run', ParseIntPipe) run: number): Promise<{
    run: number;
    clientName: string;
    bankAccount: any | null;
  }> {
    const profile = await this.clientRepository.getProfileByRun(run);
    const p = profile?.toValue?.() as any;
    const clientName = [p?.names, p?.firstLastName, p?.secondLastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    const bankAccount = await this.repo.findByUserRun(run);
    return { run, clientName, bankAccount };
  }
}