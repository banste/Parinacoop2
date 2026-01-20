import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RegisterDto } from '../../dto/register.dto';
import { RegisterUseCase } from '../../../application/register-use-case/register.use-case';

@ApiTags('Auth')
@Controller('auth')
export class RegisterController {
  constructor(private readonly registerUseCase: RegisterUseCase) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar nuevo usuario/cliente' })
  async register(@Body() body: RegisterDto) {
    // RegisterUseCase debe encargarse de validaciones de negocio, hashing de password,
    // creación de user y client profile, etc.
    const result = await this.registerUseCase.execute(body);
    return { message: 'Usuario registrado', data: result };
  }
}