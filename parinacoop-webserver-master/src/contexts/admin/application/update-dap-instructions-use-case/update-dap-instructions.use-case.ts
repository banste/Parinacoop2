import { Injectable } from '@nestjs/common';
import {
  DapInstructionsStore,
  DapInstructions,
} from '../../../dap/infrastructure/dap-instructions.store';

@Injectable()
export class UpdateDapInstructionsUseCase {
  constructor(private readonly store: DapInstructionsStore) {}

  async execute(payload: DapInstructions): Promise<void> {
    await this.store.set(payload);
  }
}
