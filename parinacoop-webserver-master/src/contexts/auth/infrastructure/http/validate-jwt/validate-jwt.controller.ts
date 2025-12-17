import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { User } from '@/contexts/shared/decorators/user.decorator';
import { AuthGuard } from '@/contexts/shared/guards/auth.guard';
import { UserRequest } from '@/utils/interfaces/user-request.interface';

@ApiTags('Autenticación')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('auth')
export class ValidateJwtController {
  constructor() {}

  @HttpCode(HttpStatus.OK)
  @Post('auto-login')
  async run(@User() user: UserRequest): Promise<UserRequest> {
    return user;
  }
}
