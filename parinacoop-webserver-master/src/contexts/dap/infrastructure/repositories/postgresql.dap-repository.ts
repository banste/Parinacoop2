import { Injectable } from '@nestjs/common';
import { Database } from '@/database/database';
import { Dap } from '@/contexts/dap/domain/models/Dap';
import { DapRepository } from '@/contexts/dap/domain/ports/dap.repository';

@Injectable()
export class PostgreSqlDapRepository implements DapRepository {
  constructor(private db: Database) {}

  async create(dap: Dap): Promise<Dap> {
    const data = dap.toValue();

    // 🔒 Conversión segura a número
    const userRun = Number(data.userRun);
    const days = Number(data.days);
    const initialAmount = Number(data.initialAmount);
    const profit = Number(data.profit);
    const interestRateInMonth = Number(data.interestRateInMonth);
    const interestRateInPeriod = Number(data.interestRateInPeriod);
    const finalAmount = initialAmount + profit;

    // 🚨 Validación anti-NaN
    const numeric = {
      userRun,
      days,
      initialAmount,
      profit,
      interestRateInMonth,
      interestRateInPeriod,
      finalAmount,
    };

    const invalid = Object.entries(numeric).filter(
      ([, v]) => Number.isNaN(v),
    );

    if (invalid.length > 0) {
      throw new Error(
        `DAP inválido (NaN): ${invalid.map(([k]) => k).join(', ')}`
      );
    }

    // ✅ UN SOLO INSERT (correcto en Postgres)
    const inserted = await this.db
      .insertInto('dap')
      .values({
        user_run: userRun,
        type: data.type,
        currency_type: data.currencyType,
        days,
        initial_amount: initialAmount,
        due_date: data.dueDate,
        profit,
        interest_rate_in_month: interestRateInMonth,
        interest_rate_in_period: interestRateInPeriod,
        status: data.status,
        final_amount: finalAmount,
        initial_date: data.initialDate,
      })
      .returning([
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
        'interest_rate_in_month as interestRateInMonth',
        'final_amount as finalAmount',
      ])
      .executeTakeFirstOrThrow();

    return new Dap(inserted);
  }

  async getDapsByUserRun(run: number): Promise<Dap[]> {
    const result = await this.db
      .selectFrom('dap')
      .where('user_run', '=', Number(run))
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
}
