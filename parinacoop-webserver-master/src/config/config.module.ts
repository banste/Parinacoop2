import { Module } from '@nestjs/common';
import { ConfigModule as NestJsConfigModule } from '@nestjs/config';
import { validate } from './env.validation';

@Module({
  imports: [
    NestJsConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'development'
          ? '.env.development.local'
          : '.env.production.local',
      validate,
    }),
  ],
})
export class ConfigModule {}
