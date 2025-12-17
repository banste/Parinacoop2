import { CreateClientUseCase } from '@/contexts/admin/application/create-client-use-case/create-client.use-case';
import { TPrimitiveUser } from '@/contexts/admin/domain/models/User';
import { Roles } from '@/contexts/shared/decorators/roles.decorator';
import { Role } from '@/contexts/shared/enums/roles.enum';
import { AuthGuard } from '@/contexts/shared/guards/auth.guard';
import { RolesGuard } from '@/contexts/shared/guards/roles.guard';
import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateClientHttpDto } from './create-client.http-dto';
import { UserClientExistsException } from '@/contexts/admin/domain/exceptions/user-client-exists.exception';

@ApiTags('Administrador')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@UseGuards(AuthGuard, RolesGuard)
@Controller('admin')
export class CreateClientController {
  constructor(private createClientUseCase: CreateClientUseCase) {}

  @Post('clients')
  async run(
    @Body() httpDto: CreateClientHttpDto,
  ): Promise<{ userclient: TPrimitiveUser }> {
    try {
      return await this.createClientUseCase.execute(httpDto);
    } catch (error) {
      if (error instanceof UserClientExistsException) {
        throw new UnprocessableEntityException(error.message);
      }

      throw new BadRequestException('Error al crear el cliente');
    }
  }
}
