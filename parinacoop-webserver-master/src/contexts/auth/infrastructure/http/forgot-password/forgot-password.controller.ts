import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ForgotPasswordHttpDto } from './forgot-password.http-dto';
import { ForgotPasswordUseCase } from '@/contexts/auth/application/forgot-password/forgot-password.use-case';
import { Public } from '@/contexts/shared/decorators/public.decorator';

@Public()
@Controller('auth')
export class ForgotPasswordController {
  constructor(private readonly forgotUseCase: ForgotPasswordUseCase) {}

  // Responder siempre 200 con mensaje genérico
  @Post('forgot-password')
  @HttpCode(200)
  async run(@Body() dto: ForgotPasswordHttpDto) {
    const runDigits = String(dto.run || '').replace(/\D/g, '');
    const runNumber = Number(runDigits) || 0;

    // Ejecutar el use-case (maneja internamente logging/errores de envío)
    await this.forgotUseCase.execute(runNumber);

    return {
      ok: true,
      message: 'Si la cuenta existe, se ha enviado un correo para recuperar la contraseña.',
    };
  }
}