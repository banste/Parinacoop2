import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';

import { Database } from '@/database/database';

import { Dap } from '@/contexts/dap/domain/models/Dap';
import { DapRepository } from '@/contexts/dap/domain/ports/dap.repository';
import { DapStatus } from '@/contexts/dap/domain/dap-status.enum';

/**
 * MySQL-backed implementation of DapRepository.
 *
 * Key differences vs Postgres:
 * - MySQL doesn't support `returning()` / `returningAll()` the way Kysely generates it.
 * - For inserts: we use insertId then SELECT the created row.
 * - For updates that previously used returningAll(): we perform UPDATE then SELECT.
 */
@Injectable()
export class MySqlDapRepository implements DapRepository {
  constructor(private db: Database) {}

  // Crear un DAP y devolver la entidad creada
  async create(dap: Dap): Promise<Dap> {
    const data = dap.toValue();

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
      .executeTakeFirst();

    const newId = Number((insertResult as any)?.insertId);

    const newDap = await this.db
      .selectFrom('dap')
      .where('id', '=', newId)
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
        'interest_rate_in_month as interestRateInMonth',
        'final_amount as finalAmount',
      ])
      .executeTakeFirstOrThrow();

    return new Dap(newDap);
  }

  // Obtener todos los DAP de un usuario (EXCLUYENDO los ANNULLED)
  async getDapsByUserRun(run: number): Promise<Dap[]> {
    const result = await this.db
      .selectFrom('dap')
      .leftJoin('dap_internal_ids', 'dap_internal_ids.dap_id', 'dap.id')
      .where('user_run', '=', run)
      .where(sql`lower(dap.status)`, '!=', DapStatus.ANNULLED)
      .select([
        'dap.id',
        'dap.user_run as userRun',
        'dap.type',
        'dap.currency_type as currencyType',
        'dap.days',
        'dap.status',
        'dap.initial_date as initialDate',
        'dap.initial_amount as initialAmount',
        'dap.due_date as dueDate',
        'dap.profit',
        'dap.interest_rate_in_period as interestRateInPeriod',
        'dap.interest_rate_in_month as interestRateInMonth',
        'dap.final_amount as finalAmount',
        'dap_internal_ids.internal_id as internalId',
      ])
      .execute();

    return result.map((row) => new Dap(row));
  }

  // Nuevo: obtener SOLO DAPs con status = CANCELLED para un usuario (case-insensitive)
  async getCancelledDapsByUserRun(run: number): Promise<Dap[]> {
    const rows = await this.db
      .selectFrom('dap')
      .leftJoin('dap_internal_ids', 'dap_internal_ids.dap_id', 'dap.id')
      .where('user_run', '=', run)
      .where(sql`lower(dap.status)`, '=', DapStatus.CANCELLED)
      .select([
        'dap.id',
        'dap.user_run as userRun',
        'dap.type',
        'dap.currency_type as currencyType',
        'dap.days',
        'dap.status',
        'dap.initial_date as initialDate',
        'dap.initial_amount as initialAmount',
        'dap.due_date as dueDate',
        'dap.profit',
        'dap.interest_rate_in_period as interestRateInPeriod',
        'dap.interest_rate_in_month as interestRateInMonth',
        'dap.final_amount as finalAmount',
        'dap_internal_ids.internal_id as internalId',
      ])
      .execute();

    return rows.map((row) => new Dap(row));
  }

  // Buscar un DAP por id y run de usuario.
  async findByIdAndUserRun(id: number, run: number): Promise<Dap | null> {
    const row = await this.db
      .selectFrom('dap')
      .leftJoin('dap_internal_ids', 'dap_internal_ids.dap_id', 'dap.id')
      .where('dap.id', '=', id)
      .where('dap.user_run', '=', run)
      .select([
        'dap.id',
        'dap.user_run as userRun',
        'dap.type',
        'dap.currency_type as currencyType',
        'dap.days',
        'dap.status',
        'dap.initial_date as initialDate',
        'dap.initial_amount as initialAmount',
        'dap.due_date as dueDate',
        'dap.profit',
        'dap.interest_rate_in_period as interestRateInPeriod',
        'dap.interest_rate_in_month as interestRateInMonth',
        'dap.final_amount as finalAmount',
        'dap_internal_ids.internal_id as internalId',
      ])
      .executeTakeFirst();

    return row ? new Dap(row) : null;
  }

  // Busca un DAP por internal_id
  async findByInternalId(internalId: string): Promise<Dap | null> {
    const row = await this.db
      .selectFrom('dap')
      .innerJoin('dap_internal_ids', 'dap_internal_ids.dap_id', 'dap.id')
      .where('dap_internal_ids.internal_id', '=', internalId)
      .select([
        'dap.id',
        'dap.user_run as userRun',
        'dap.type',
        'dap.currency_type as currencyType',
        'dap.days',
        'dap.status',
        'dap.initial_date as initialDate',
        'dap.initial_amount as initialAmount',
        'dap.due_date as dueDate',
        'dap.profit',
        'dap.interest_rate_in_period as interestRateInPeriod',
        'dap.interest_rate_in_month as interestRateInMonth',
        'dap.final_amount as finalAmount',
      ])
      .executeTakeFirst();

    return row ? new Dap(row) : null;
  }

  // Devuelve el internal_id asociado a un dapId o null si no existe
  async findInternalIdByDapId(dapId: number): Promise<string | null> {
    const row = await this.db
      .selectFrom('dap_internal_ids')
      .select(['internal_id'])
      .where('dap_internal_ids.dap_id', '=', dapId)
      .executeTakeFirst();

    if (!row) return null;
    return (row as any).internal_id ?? null;
  }

  /**
   * Actualiza el estado (status) por id y devuelve la entidad actualizada.
   * MySQL: no `returningAll()`, hacemos UPDATE y luego SELECT.
   */
  async updateStatusById(id: number, status: DapStatus | string): Promise<Dap | null> {
    await this.db
      .updateTable('dap')
      .set({ status: status as any })
      .where('id', '=', id)
      .execute();

    const update = await this.db
      .selectFrom('dap')
      .where('id', '=', id)
      .selectAll()
      .executeTakeFirst();

    if (!update) return null;

    const row = {
      id: (update as any).id,
      userRun: (update as any).user_run,
      type: (update as any).type,
      currencyType: (update as any).currency_type,
      days: (update as any).days,
      status: (update as any).status,
      initialDate: (update as any).initial_date,
      initialAmount: (update as any).initial_amount,
      dueDate: (update as any).due_date,
      profit: (update as any).profit,
      interestRateInPeriod: (update as any).interest_rate_in_period,
      interestRateInMonth: (update as any).interest_rate_in_month,
      finalAmount: (update as any).final_amount,
    };

    return new Dap(row);
  }

  /**
   * Actualiza el estado (status) de un dap por id.
   */
  async updateStatus(dapId: number, status: string, updatedBy?: number): Promise<void> {
    const sRaw = String(status ?? '').trim();
    const s = sRaw.toUpperCase();

    const allowed = ['PENDING', 'ACTIVE', 'CANCELLED', 'ANNULLED'];
    if (!allowed.includes(s)) {
      throw new Error(`Invalid status ${s}`);
    }

    await this.db
      .updateTable('dap')
      .set(({
        status: s,
        updated_at: new Date(),
        // updated_by: updatedBy ?? null, // descomenta si tienes esa columna
      } as unknown) as any)
      .where('id', '=', Number(dapId))
      .execute();
  }

  // Inserta o actualiza un registro en dap_internal_ids para auditar la asignación
  async attachInternalId(dapId: number, internalId: string, createdByRun: number): Promise<void> {
    const existing = await this.db
      .selectFrom('dap_internal_ids')
      .where('internal_id', '=', internalId)
      .select(['id', 'dap_id'])
      .executeTakeFirst();

    if (existing) {
      await this.db
        .updateTable('dap_internal_ids')
        .set({
          dap_id: dapId,
          created_by_run: createdByRun,
          created_at: sql`now()`,
        } as any)
        .where('internal_id', '=', internalId)
        .execute();
      return;
    }

    try {
      await this.db
        .insertInto('dap_internal_ids')
        .values({
          dap_id: dapId,
          internal_id: internalId,
          created_by_run: createdByRun,
          created_at: new Date(),
        })
        .execute();
    } catch (err) {
      // fallback (race condition)
      try {
        await this.db
          .updateTable('dap_internal_ids')
          .set({ dap_id: dapId, created_by_run: createdByRun })
          .where('internal_id', '=', internalId)
          .execute();
      } catch (innerErr) {
        console.warn('attachInternalId: fallback update failed', innerErr);
      }
    }
  }
}