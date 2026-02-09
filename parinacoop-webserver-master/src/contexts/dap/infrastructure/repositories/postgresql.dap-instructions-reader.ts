import { Injectable } from '@nestjs/common';
import { Database } from '@/database/database';

@Injectable()
export class DapInstructionsRepository {
  constructor(private readonly db: Database) {}

  async getLatest() {
    return this.db
      // cast table name to any to satisfy Kysely's TableExpression typing
      .selectFrom('dap_instructions' as any)
      .selectAll()
      .orderBy('updated_at', 'desc')
      .limit(1)
      .executeTakeFirst();
  }

  /**
   * Inserta una nueva fila con la configuración de DAP.
   * Usamos insert en vez de update para mantener un historial y que getLatest siga funcionando.
   */
  async create(payload: {
    bankName: string;
    accountType: string;
    accountNumber: string;
    accountHolderName: string;
    accountHolderRut: string;
    email?: string | null;
    description: string;
  }) {
    const now = new Date();
    // Mapear a nombres de columna DB
    const row = await this.db
      .insertInto('dap_instructions' as any)
      .values({
        bank_name: payload.bankName,
        account_type: payload.accountType,
        account_number: payload.accountNumber,
        account_holder_name: payload.accountHolderName,
        account_holder_rut: payload.accountHolderRut,
        email: payload.email ?? null,
        description: payload.description,
        updated_at: now,
      })
      // returningAll() funciona en Postgres (devuelve la fila insertada)
      .returningAll()
      .executeTakeFirst();

    return row;
  }
}