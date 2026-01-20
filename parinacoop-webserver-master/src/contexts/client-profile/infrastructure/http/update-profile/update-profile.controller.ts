import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
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
    // Normalizamos/transformamos valores recibidos y proveemos default para detail
    const dto: UpdateProfileDto = {
      documentNumber: Number(dtoHttp.documentNumber),
      names: String(dtoHttp.names),
      firstLastName: String(dtoHttp.firstLastName),
      secondLastName: String(dtoHttp.secondLastName),
      email: String(dtoHttp.email),
      cellphone: String(dtoHttp.cellphone),
      street: String(dtoHttp.street),
      number: Number(dtoHttp.number),
      detail: dtoHttp.detail ?? '',
      regionId: Number(dtoHttp.regionId),
      communeId: Number(dtoHttp.communeId),
    };

    // Firma del use-case: (run, dto)
    return await this.updateProfileUseCase.execute(run, dto);
  }
}