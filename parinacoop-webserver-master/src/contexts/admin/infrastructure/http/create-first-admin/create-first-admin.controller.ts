import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CreateFirstAdminUseCase } from '@/contexts/admin/application';
import { TPrimitiveUser } from '@/contexts/admin/domain/models/User';
import { AdminExistsException } from '@/contexts/admin/domain/exceptions/admin-exists.exception';

import { CreateFirstAdminHttpDto } from './create-first-admin.http-dto';

@ApiTags('Administrador')
@Controller('admin')
export class CreateFirstAdminController {
  constructor(private createFirstAdminUseCase: CreateFirstAdminUseCase) {}

  @Post('first')
  async run(
    @Body() httpDto: CreateFirstAdminHttpDto,
  ): Promise<{ admin: TPrimitiveUser }> {
    try {
      return await this.createFirstAdminUseCase.execute(httpDto);
    } catch (error) {
      console.log(error);

      if (error instanceof AdminExistsException) {
        throw new UnauthorizedException(error.message);
      }
      throw new BadRequestException();
    }
  }
}
