import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class HashingService {
  private saltOrRounds: number = 10;

  constructor() {}

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.saltOrRounds);
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
