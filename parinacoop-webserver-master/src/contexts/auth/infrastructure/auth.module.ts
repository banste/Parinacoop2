import { Module } from '@nestjs/common';
import { LoginUseCase } from '../application/login-use-case/login.use-case';
import { LoginController } from './http/login/login.controller';
import { UserRepository } from '../domain/user.repository';
import { PostgresUserRepository } from './repositories/postgres.user-repository';
import { JwtModule } from '@nestjs/jwt';
import { EnvironmentVariables } from '@/config/environment-variables.schema';
import { ConfigService } from '@nestjs/config';
import { ValidateJwtController } from './http/validate-jwt/validate-jwt.controller';

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
  ],
  controllers: [LoginController, ValidateJwtController],
  providers: [
    LoginUseCase,
    {
      provide: UserRepository,
      useClass: PostgresUserRepository,
    },
  ],
  exports: [LoginUseCase],
})
export class AuthModule {}
