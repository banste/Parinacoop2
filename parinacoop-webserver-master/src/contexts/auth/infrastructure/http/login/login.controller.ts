import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

import { InvalidCredentialsException } from '@/contexts/auth/domain/invalid-credentials.exception';
import { LoginUseCase } from '@/contexts/auth/application/login-use-case/login.use-case';

import { LoginHttpDto } from './login.http-dto';

@ApiTags('Autenticación')
@Controller('auth')
export class LoginController {
  constructor(private loginUseCase: LoginUseCase) {}

  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Al iniciar sesión correctamente, se obtiene un access_token',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Las credenciales son incorrectas',
  })
  @Post('login')
  async run(
    @Body() loginHttpDto: LoginHttpDto,
  ): Promise<{ accessToken: string }> {
    try {
      return await this.loginUseCase.execute(loginHttpDto);
    } catch (error) {
      console.error(error);

      if (error instanceof InvalidCredentialsException) {
        throw new UnauthorizedException('Las credenciales no son correctas.');
      }
      throw new BadRequestException('Error al iniciar sesión');
    }
  }
}
