import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from './config/environment-variables.schema';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './contexts/auth/infrastructure/auth.module';
import { LocationModule } from './contexts/location/infrastructure/location.module';
import { HealthModule } from './health/health.module';
import { SharedModule } from './contexts/shared/shared.module';
import { ClientProfileModule } from './contexts/client-profile/infrastructure/client-profile.module';
import { DapModule } from './contexts/dap/infrastructure/dap.module';
import { ConfigModule } from './config/config.module';
import { AdminModule } from './contexts/admin/infrastructure/admin.module';
import { UsersModule } from './contexts/users/infrastructure/users.module';

// NEW
import { BankAccountModule } from './contexts/bank-account/bank-account.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvironmentVariables>) => ({
        host: configService.get('DB_HOST'),
        database: configService.get('DB_NAME'),
        port: configService.get('DB_PORT'),
        user: configService.get('DB_USER'),
        password: configService.get('DB_PASSWORD'),
      }),
    }),
    SharedModule,

    HealthModule,
    AdminModule,
    UsersModule,
    AuthModule,

    ClientProfileModule,
    DapModule,

    // NEW: bank account endpoints under /clients/:run/bank-account
    BankAccountModule,

    LocationModule,
  ],
})
export class AppModule {}