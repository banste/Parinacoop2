import { Injectable } from '@nestjs/common';
import { Database } from '@/database/database';
import { DapRepository } from '../../domain/ports/dap.repository';
import { Dap } from '../../domain/models/Dap';

@Injectable()
export class PostgreSqlDapRepository implements DapRepository {
  constructor(private readonly db: Database) {}

  async create(dap: Dap): Promise<Dap> {
    // ✅ evitamos depender de nombres exactos del dominio
    const d: any = dap as any;

    const created = await this.db
      .insertInto('dap')
      .values({
        user_run: d.userRun,
        type: d.type,
        currency_type: d.currencyType,
        status: d.status,
        days: d.days,
        initial_date: d.initialDate,
        initial_amount: d.initialAmount,

        // estos 3 te estaban fallando por nombre, los leemos “tolerante”
        due_date: d.dueDate ?? d.due_date,
        final_amount: d.finalAmount ?? d.final_amount,
        profit: d.profit,
        interest_rate_in_period: d.interestRateInPeriod ?? d.interest_rate_in_period,
        interest_rate_in_month: d.interestRateInMonth ?? d.interest_rate_in_month,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return created as unknown as Dap;
  }

  async getDapsByUserRun(run: number): Promise<Dap[]> {
    const rows = await this.db
      .selectFrom('dap')
      .selectAll()
      .where('user_run', '=', run)
      .orderBy('id', 'desc')
      .execute();

    return rows as unknown as Dap[];
  }

  async findByIdAndUserRun(id: number, run: number): Promise<Dap | null> {
    const row = await this.db
      .selectFrom('dap')
      .selectAll()
      .where('id', '=', id)
      .where('user_run', '=', run)
      .executeTakeFirst();

    return (row as unknown as Dap) ?? null;
  }
}
