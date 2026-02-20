import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Put,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthGuard } from '@/contexts/shared/guards/auth.guard';
import { User } from '@/contexts/shared/decorators/user.decorator';
import { UserRequest } from '@/utils/interfaces/user-request.interface';

import { ClientRepository } from '@/contexts/client-profile/domain/ports/client.repository';
import { extractRunFromRut } from '@/utils/validators/rut.validator';

import { UpsertBankAccountDto } from '../../dto/upsert-bank-account.dto';
import { MySqlClientBankAccountRepository } from '../repositories/mysql.client-bank-account.repository';

@ApiTags('Bank Account (clientes)')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('clients')
export class ClientBankAccountController {
  constructor(
    private readonly repo: MySqlClientBankAccountRepository,
    private readonly clientRepository: ClientRepository,
  ) {}

  @ApiResponse({ status: HttpStatus.OK, description: 'Cuenta bancaria del cliente (o null si no existe)' })
  @Get(':run/bank-account')
  async get(
    @User() user: UserRequest,
    @Param('run', ParseIntPipe) run: number,
  ): Promise<{ run: number; clientName: string; bankAccount: any | null }> {
    if ((user as any).run !== run) {
      throw new UnauthorizedException('No está autorizado a ver esta información');
    }

    const profile = await this.clientRepository.getProfileByRun(run);
    const p = profile?.toValue?.() as any;
    const clientName = [p?.names, p?.firstLastName, p?.secondLastName].filter(Boolean).join(' ').trim();

    const bankAccount = await this.repo.findByUserRun(run);

    return { run, clientName, bankAccount };
  }

  @ApiResponse({ status: HttpStatus.OK, description: 'Crea o actualiza la cuenta bancaria del cliente' })
  @HttpCode(HttpStatus.OK)
  @Put(':run/bank-account')
  async upsert(
    @User() user: UserRequest,
    @Param('run', ParseIntPipe) run: number,
    @Body() dto: UpsertBankAccountDto,
  ): Promise<{ ok: true }> {
    if ((user as any).run !== run) {
      throw new UnauthorizedException('No está autorizado a modificar esta información');
    }

    const ownerRun = extractRunFromRut(dto.rutOwner);

    // DEBUG (temporal)
    console.log('[bank-account] upsert', {
      urlRun: run,
      rutOwner: dto.rutOwner,
      ownerRun,
      authRun: (user as any).run,
    });

    if (!ownerRun) {
      throw new BadRequestException(`RUT/RUN del titular inválido: "${dto.rutOwner}"`);
    }
    if (ownerRun !== run) {
      throw new BadRequestException(
        `El RUT no corresponde al dueño de la cuenta (ownerRun=${ownerRun}, run=${run})`,
      );
    }

    await this.repo.upsert(run, {
      rutOwner: dto.rutOwner,
      bankCode: dto.bankCode,
      bankName: dto.bankName,
      accountType: dto.accountType,
      accountNumber: dto.accountNumber,
      email: dto.email ?? null,
    });

    return { ok: true };
  }
}