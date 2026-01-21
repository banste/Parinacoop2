import { Injectable, Logger } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { UserRepository } from '@/contexts/auth/domain/user.repository';
import { PasswordResetRepository } from '@/contexts/auth/domain/password-reset.repository';
import { MailService } from '@/contexts/shared/providers/mail.service';

@Injectable()
export class ForgotPasswordUseCase {
  private readonly logger = new Logger(ForgotPasswordUseCase.name);
  private readonly ttlMs = Number(process.env.PASSWORD_RESET_TTL_MINUTES || 30) * 60 * 1000;

  constructor(
    private readonly userRepo: UserRepository,
    private readonly passwordResetRepo: PasswordResetRepository,
    private readonly mailService: MailService,
  ) {}

  private generateToken(): string {
    return randomBytes(24).toString('hex'); // token legible para email
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async execute(run: number): Promise<void> {
    try {
      if (!run || Number.isNaN(run)) {
        this.logger.debug('Forgot password called with invalid run: ' + run);
        return;
      }

      const user = await this.userRepo.getByRun(run);
      if (!user) {
        this.logger.debug(`No user found for run ${run}`);
        return; // comportamiento genérico: no informar al cliente
      }

      const profile = user.toValue().profile;
      const email = profile?.email;
      if (!email) {
        this.logger.debug(`User ${run} has no email`);
        return;
      }

      // Generar token plain y su hash
      const token = this.generateToken();
      const tokenHash = this.hashToken(token);
      const expiresAt = Date.now() + this.ttlMs;

      // Guardar en BD: guardamos tanto token plain (para cumplir la restricción NOT NULL)
      // como token_hash (para validación segura). En producción, considerar eliminar token plain.
      await this.passwordResetRepo.upsert(run, token, tokenHash, expiresAt);

      // Enviar correo (si falla, solo logueamos)
      try {
        await this.mailService.sendForgotPasswordEmail(email, token);
      } catch (err) {
        this.logger.error('Error sending forgot-password email', err as any);
      }
    } catch (err) {
      this.logger.error('Error in ForgotPasswordUseCase', err as any);
    }
  }
}