import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ResetPasswordHttpDto } from './reset-password.http-dto';
import { ResetPasswordUseCase } from '../../../application/reset-password/reset-password.use-case';
import { Public } from '@/contexts/shared/decorators/public.decorator';

@Public()
@Controller('auth')
export class ResetPasswordController {
  constructor(private readonly resetUseCase: ResetPasswordUseCase) {}

  @Post('reset-password')
  @HttpCode(200)
  async run(@Body() dto: ResetPasswordHttpDto) {
    // Normalizar run: extraer sólo dígitos
    const runDigits = String(dto.run || '').replace(/\D/g, '');
    const runNumber = Number(runDigits) || 0;

    await this.resetUseCase.execute({
      run: runNumber,
      token: dto.token,
      newPassword: dto.newPassword,
    });

    return {
      ok: true,
      message: 'Si el token es válido, la contraseña ha sido actualizada.',
    };
  }
}