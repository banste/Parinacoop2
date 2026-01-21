import { Module } from '@nestjs/common';
import { LoginUseCase } from '../application/login-use-case/login.use-case';
import { LoginController } from './http/login/login.controller';
import { UserRepository } from '../domain/user.repository';
import { PostgresUserRepository } from './repositories/postgres.user-repository';
import { JwtModule } from '@nestjs/jwt';
import { EnvironmentVariables } from '@/config/environment-variables.schema';
import { ConfigService } from '@nestjs/config';
import { ValidateJwtController } from './http/validate-jwt/validate-jwt.controller';
import { RegisterUseCase } from '@/contexts/auth/application/register-use-case/register.use-case';
import { RegisterController } from './http/register/register.controller';

import { ForgotPasswordController } from './http/forgot-password/forgot-password.controller';
import { ForgotPasswordUseCase } from '@/contexts/auth/application/forgot-password/forgot-password.use-case';
import { PasswordResetRepository } from '../domain/password-reset.repository';

import { ResetPasswordController } from './http/reset-password/reset-password.controller';
import { ResetPasswordUseCase } from '@/contexts/auth/application/reset-password/reset-password.use-case';

// Import SharedModule so HashingService / MailService are available
import { SharedModule } from '@/contexts/shared/shared.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      global: true,
      useFactory: (configService: ConfigService<EnvironmentVariables>) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN') },
      }),
    }),
    SharedModule,
  ],
  controllers: [
    LoginController,
    ValidateJwtController,
    RegisterController,
    ForgotPasswordController,
    ResetPasswordController,
  ],
  providers: [
    LoginUseCase,
    RegisterUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    PasswordResetRepository,
    {
      provide: UserRepository,
      useClass: PostgresUserRepository,
    },
  ],
  exports: [LoginUseCase],
})
export class AuthModule {}