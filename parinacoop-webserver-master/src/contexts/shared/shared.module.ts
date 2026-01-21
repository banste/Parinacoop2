// src/contexts/shared/shared.module.ts
import { Global, Module } from '@nestjs/common';
import { HashingService } from './providers';
import { MailService } from './providers/mail.service';

@Global()
@Module({
  providers: [HashingService, MailService],
  exports: [HashingService, MailService],
})
export class SharedModule {}