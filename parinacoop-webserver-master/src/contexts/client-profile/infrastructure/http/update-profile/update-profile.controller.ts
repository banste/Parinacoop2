import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';

import { UpdateProfileUseCase } from '@/contexts/client-profile/application/update-profile/update-profile.use-case';
import { AuthGuard } from '@/contexts/shared/guards/auth.guard';

import { UpdateProfileHttpDto } from './update-profile.http-dto';
import { UpdateProfileDto } from '@/contexts/client-profile/application/update-profile/update-profile.dto';

@ApiTags('Perfil de cliente')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('profile')
export class UpdateProfileController {
  constructor(private updateProfileUseCase: UpdateProfileUseCase) {}

  @Patch(':run')
  async run(
    @Param('run', ParseIntPipe) run: number,
    @Body() dtoHttp: UpdateProfileHttpDto,
  ): Promise<{ msg: string }> {
    // Log para depuración rápida (elimina en prod)
    console.log('[UpdateProfileController] incoming body:', dtoHttp);

    // Sanitizar documentNumber: quitar todo no numérico y convertir a number para la capa dominio
    const rawDoc = (dtoHttp as any)?.documentNumber ?? '';
    const digitsOnly = String(rawDoc).replace(/\D/g, '');
    const documentNumber = digitsOnly === '' ? 0 : Number(digitsOnly);

    // Validación local mínima (el DTO ya valida la mayoría)
    const numberValue = Number((dtoHttp as any)?.number ?? 0);
    if (isNaN(numberValue) || numberValue <= 0) {
      throw new BadRequestException('Número de dirección inválido');
    }

    // Normalizar region/commune a números (usar 0 si no vienen)
    const regionId = dtoHttp.regionId ?? 0;
    const communeId = dtoHttp.communeId ?? 0;

    const dto: UpdateProfileDto = {
      documentNumber,
      names: String(dtoHttp.names ?? ''),
      firstLastName: String(dtoHttp.firstLastName ?? ''),
      secondLastName: String(dtoHttp.secondLastName ?? ''),
      email: String(dtoHttp.email ?? ''),
      cellphone: String(dtoHttp.cellphone ?? ''),
      street: String(dtoHttp.street ?? ''),
      number: numberValue,
      detail: dtoHttp.detail ?? '',
      regionId: Number(regionId),
      communeId: Number(communeId),
    };

    return await this.updateProfileUseCase.execute(run, dto);
  }
}