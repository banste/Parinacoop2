import { Injectable } from '@nestjs/common';
import { DapInstructionsStore } from '../../../dap/infrastructure/dap-instructions.store';


@Injectable()
export class GetDapInstructionsUseCase {
  constructor(private readonly store: DapInstructionsStore) {}

  async execute() {
    return this.store.get();
  }
}
