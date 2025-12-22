import { Controller, Get, NotFoundException } from '@nestjs/common';
import { DapInstructionsRepository } from '@/database/repositories/dap-instructions.repository';

@Controller()
export class GetDapInstructionsController {
  constructor(private readonly dapInstructionsRepository: DapInstructionsRepository) {}

  @Get('dap-instructions')
  async get() {
    const row = await this.dapInstructionsRepository.getLatest();
    if (!row) throw new NotFoundException('No hay configuración de DAP');

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
