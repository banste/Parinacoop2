import { Injectable } from '@nestjs/common';
import { DapInstructionsRepository } from '@/database/repositories/dap-instructions.repository';

@Injectable()
export class GetDapInstructionsUseCase {
  constructor(private readonly repo: DapInstructionsRepository) {}

  async execute() {
    const row = await this.repo.getLatest();
    if (!row) return null;
    return {
      bankName: row.bank_name,
      accountType: row.account_type,
      accountNumber: row.account_number,
      accountHolderName: row.account_holder_name,
      accountHolderRut: row.account_holder_rut,
      email: row.email,
      description: row.description,
      updatedAt: row.updated_at,
    };
  }
}