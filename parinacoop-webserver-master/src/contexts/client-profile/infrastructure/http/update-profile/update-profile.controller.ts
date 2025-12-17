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
    return await this.updateProfileUseCase.execute({ ...dtoHttp, run });
  }
}
