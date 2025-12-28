import { Injectable } from '@nestjs/common';

import { Database } from '@/database/database';

import { Dap } from '@/contexts/dap/domain/models/Dap';
import { DapRepository } from '@/contexts/dap/domain/ports/dap.repository';

@Injectable()
export class PostgreSqlDapRepository implements DapRepository {
  constructor(private db: Database) {}

  // Crear un DAP y devolver la entidad creada
  async create(dap: Dap): Promise<Dap> {
    const data = dap.toValue();

    // En Postgres debemos usar returning('id') para obtener el id insertado
    const insertResult = await this.db
      .insertInto('dap')
      .values({
        user_run: data.userRun,
        type: data.type,
        currency_type: data.currencyType,
        days: data.days,
        initial_amount: data.initialAmount,
        due_date: data.dueDate,
        profit: data.profit,
        interest_rate_in_month: data.interestRateInMonth,
        interest_rate_in_period: data.interestRateInPeriod,
        status: data.status,
        final_amount: data.initialAmount + data.profit,
        initial_date: data.initialDate,
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    // insertResult suele ser { id: number }
    const newId = (insertResult as any).id;

    const newDap = await this.db
      .selectFrom('dap')
      .where('id', '=', Number(newId))
      .select([
        'id',
        'user_run as userRun',
        'type',
        'currency_type as currencyType',
        'days',
        'status',
        'initial_date as initialDate',
        'initial_amount as initialAmount',
        'due_date as dueDate',
        'profit',
        'interest_rate_in_period as interestRateInPeriod',
        'dap.interest_rate_in_month as interestRateInMonth',
        'final_amount as finalAmount',
      ])
      .executeTakeFirstOrThrow();

    return new Dap(newDap);
  }

  // Obtener todos los DAP de un usuario
  async getDapsByUserRun(run: number): Promise<Dap[]> {
    const result = await this.db
      .selectFrom('dap')
      .where('user_run', '=', run)
      .select([
        'id',
        'user_run as userRun',
        'type',
        'currency_type as currencyType',
        'days',
        'status',
        'initial_date as initialDate',
        'initial_amount as initialAmount',
        'due_date as dueDate',
        'profit',
        'interest_rate_in_period as interestRateInPeriod',
        'dap.interest_rate_in_month as interestRateInMonth',
        'final_amount as finalAmount',
      ])
      .execute();

    return result.map((row) => new Dap(row));
  }

  // Implementación añadida: buscar un DAP por id y run de usuario.
  // Esto satisface el contrato si DapRepository define findByIdAndUserRun.
  async findByIdAndUserRun(id: number, run: number): Promise<Dap | null> {
    const row = await this.db
      .selectFrom('dap')
      .where('id', '=', id)
      .where('user_run', '=', run)
      .select([
        'id',
        'user_run as userRun',
        'type',
        'currency_type as currencyType',
        'days',
        'status',
        'initial_date as initialDate',
        'initial_amount as initialAmount',
        'due_date as dueDate',
        'profit',
        'interest_rate_in_period as interestRateInPeriod',
        'dap.interest_rate_in_month as interestRateInMonth',
        'final_amount as finalAmount',
      ])
      .executeTakeFirst();

    return row ? new Dap(row) : null;
  }
}