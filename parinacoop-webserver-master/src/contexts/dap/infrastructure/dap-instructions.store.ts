import { Injectable } from '@nestjs/common';

export type DapInstructions = {
  bankName: string;
  accountType: string;
  accountNumber: string;
  accountHolderName: string;
  accountHolderRut: string;
  email?: string | null;
  description: string;
};

@Injectable()
export class DapInstructionsStore {
  // ✅ temporal en memoria (para probar)
  private data: DapInstructions = {
    bankName: 'Banco Ejemplo',
    accountType: 'Cuenta Corriente',
    accountNumber: '12345678',
    accountHolderName: 'PARINACOOP',
    accountHolderRut: '76.123.456-7',
    email: 'soporte@parinacoop.cl',
    description: '1) Descarga la solicitud.\n2) Firma la solicitud.\n3) Realiza transferencia a la cuenta destino...',
  };

  async get(): Promise<DapInstructions> {
    return this.data;
  }

  async set(value: DapInstructions): Promise<void> {
    this.data = value;
  }
}
