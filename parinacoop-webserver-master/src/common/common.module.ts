import { Global, Module } from '@nestjs/common';
import { HashingService } from './providers';

@Global()
@Module({
  providers: [HashingService],
  exports: [HashingService],
})
export class CommonModule {}
