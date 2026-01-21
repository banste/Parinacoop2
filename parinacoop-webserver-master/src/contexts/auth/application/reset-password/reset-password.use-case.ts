import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { UserRepository } from '@/contexts/auth/domain/user.repository';
import { PasswordResetRepository } from '@/contexts/auth/domain/password-reset.repository';
import { HashingService } from '@/contexts/shared/providers/hashing.service';

type Input = {
  run: number;
  token: string;
  newPassword: string;
};

@Injectable()
export class ResetPasswordUseCase {
  private readonly logger = new Logger(ResetPasswordUseCase.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordResetRepository: PasswordResetRepository,
    private readonly hashingService: HashingService,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async execute(input: Input): Promise<void> {
    const { run, token, newPassword } = input;
    try {
      if (!run || Number.isNaN(run)) {
        this.logger.debug('ResetPassword called with invalid run: ' + run);
        throw new BadRequestException('Invalid run or token');
      }
      if (!token || !newPassword) {
        throw new BadRequestException('Invalid payload');
      }

      const tokenHash = this.hashToken(token);

      // consumeIfValid marcará used_at si la fila es válida y no expirada.
      const valid = await this.passwordResetRepository.consumeIfValid(run, tokenHash);
      if (!valid) {
        // No explicamos motivo por seguridad
        throw new BadRequestException('Invalid or expired token');
      }

      // Hashear nueva contraseña (bcrypt)
      const hashedPassword = await this.hashingService.hash(newPassword);

      // Actualizar password del usuario
      await this.userRepository.updatePassword(run, hashedPassword);
    } catch (err) {
      this.logger.error('Error in ResetPasswordUseCase', (err as any)?.stack ?? err);
      throw err;
    }
  }
}