import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { DapInstructionsRepository } from '@/database/repositories/dap-instructions.repository';

@Injectable()
export class UpdateDapInstructionsUseCase {
  constructor(private readonly repo: DapInstructionsRepository) {}

  async execute(payload: {
    bankName: string;
    accountType: string;
    accountNumber: string;
    accountHolderName: string;
    accountHolderRut: string;
    email?: string | null;
    description: string;
  }): Promise<void> {
    // Validación básica: campos obligatorios
    if (
      !payload ||
      !String(payload.bankName ?? '').trim() ||
      !String(payload.accountType ?? '').trim() ||
      !String(payload.accountNumber ?? '').trim() ||
      !String(payload.accountHolderName ?? '').trim() ||
      !String(payload.accountHolderRut ?? '').trim() ||
      !String(payload.description ?? '').trim()
    ) {
      throw new BadRequestException('Faltan campos obligatorios en la configuración de DAP.');
    }

    try {
      await this.repo.create(payload);
    } catch (err) {
      // Re-lanzar como error de servidor con mensaje (para logs)
      console.error('Error saving dap instructions to DB', err);
      throw new InternalServerErrorException('Error al guardar configuración de DAP');
    }
  }
}