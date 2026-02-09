import { Injectable } from '@nestjs/common';
import { Database } from '@/database/database';

@Injectable()
export class DapInstructionsRepository {
  constructor(private readonly db: Database) {}

  async getLatest() {
    return this.db
      .selectFrom('dap_instructions' as any)
      .selectAll()
      .orderBy('updated_at', 'desc')
      .limit(1)
      .executeTakeFirst();
  }

  /**
   * Inserta una nueva fila con la configuración de DAP.
   * - Normaliza/valida los campos requeridos antes de insertar.
   * - Devuelve la fila insertada (Postgres: returningAll()).
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
    // Normalizar y defensiva: convertir a strings, trim y convertir empty -> null cuando corresponda
    const bank_name = (payload?.bankName ?? '').toString().trim();
    const account_type = (payload?.accountType ?? '').toString().trim();
    const account_number = (payload?.accountNumber ?? '').toString().trim();
    const account_holder_name = (payload?.accountHolderName ?? '').toString().trim();
    const account_holder_rut = (payload?.accountHolderRut ?? '').toString().trim();
    const description = (payload?.description ?? '').toString().trim();
    const email = payload?.email ? payload.email.toString().trim() : null;

    // Validación básica: campos obligatorios
    if (
      !bank_name ||
      !account_type ||
      !account_number ||
      !account_holder_name ||
      !account_holder_rut ||
      !description
    ) {
      throw new Error('Campos requeridos faltantes en create dap_instructions');
    }

    const now = new Date();

    try {
      // Insertamos la fila; returningAll() funciona en Postgres
      const row = await this.db
        .insertInto('dap_instructions' as any)
        .values({
          bank_name,
          account_type,
          account_number,
          account_holder_name,
          account_holder_rut,
          email: email ?? null,
          description,
          updated_at: now,
        })
        .returningAll()
        .executeTakeFirst();

      return row;
    } catch (err) {
      // Añadir contexto al error para facilitar debugging en logs
      console.error('DapInstructionsRepository.create error inserting row:', {
        bank_name,
        account_type,
        account_number,
        account_holder_name,
        account_holder_rut,
        email,
        description: description ? '[present]' : '[empty]',
        err,
      });
      throw err;
    }
  }
}