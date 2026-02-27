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

  // --------- Helpers: auto status por fecha (sin frontend) ---------

  private startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  private addDays(d: Date, days: number): Date {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
  }

  /**
   * Regla:
   * - due_date == mañana => 'due-soon'
   * - due_date <= hoy => 'expired'
   *
   * No pisa estados:
   * - 'expired-pending', 'paid', 'cancelled', 'annulled', 'pending'
   *
   * Retorna null si NO hay cambio.
   */
  private computeAutoStatus(currentStatus: any, dueDate: any): string | null {
    const s = String(currentStatus ?? '').toLowerCase().trim();

    const locked = new Set(['expired-pending', 'paid', 'cancelled', 'annulled', 'pending']);
    if (locked.has(s)) return null;

    if (!dueDate) return null;
    const due = new Date(dueDate);
    if (isNaN(due.getTime())) return null;

    const today0 = this.startOfDay(new Date());
    const tomorrow0 = this.addDays(today0, 1);
    const due0 = this.startOfDay(due);

    // vence mañana => due-soon
    if (due0.getTime() === tomorrow0.getTime()) return 'due-soon';

    // vence hoy o ya venció => expired
    if (due0.getTime() <= today0.getTime()) return 'expired';

    return null;
  }

  // Obtener todos los DAP de un usuario (EXCLUYENDO los ANNULLED)
  async getDapsByUserRun(run: number): Promise<Dap[]> {
    const result = await this.db
      .selectFrom('dap')
      .leftJoin('dap_internal_ids', 'dap_internal_ids.dap_id', 'dap.id')
      .where('user_run', '=', run)
      // case-insensitive: excluimos anulados aunque estén en mayúsculas en BD
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

    // 1) calcular qué DAPs requieren cambio de status
    const updates: Array<{ id: number; status: string }> = [];
    for (const row of result as any[]) {
      const next = this.computeAutoStatus(row?.status, row?.dueDate);
      if (!next) continue;

      const current = String(row?.status ?? '').toLowerCase().trim();
      if (current !== next) {
        updates.push({ id: Number(row.id), status: next });
      }
    }

    // 2) persistir cambios en DB (sin updated_at, porque la columna no existe)
    for (const u of updates) {
      await this.db
        .updateTable('dap')
        .set({
          status: u.status as any, // guardamos en minúsculas
        } as any)
        .where('id', '=', u.id)
        .execute();
    }

    // 3) devolver la lista con status corregido en memoria
    const updatedMap = new Map<number, string>(updates.map((u) => [u.id, u.status]));
    return (result as any[]).map((row) => {
      const s = updatedMap.get(Number(row.id));
      if (s) row.status = s;
      return new Dap(row);
    });
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
   *
   * Estandarización: guardamos SIEMPRE status en minúsculas.
   */
  async updateStatusById(id: number, status: DapStatus | string): Promise<Dap | null> {
    const normalized = String(status ?? '').trim().toLowerCase();

    await this.db
      .updateTable('dap')
      .set({ status: normalized as any })
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
   *
   * Allowed acordado (en MAYÚSCULAS), pero persistimos en minúsculas:
   * - validamos en mayúsculas
   * - guardamos en minúsculas
   */
  async updateStatus(dapId: number, status: string, updatedBy?: number): Promise<void> {
    const sRaw = String(status ?? '').trim();
    const sUpper = sRaw.toUpperCase();

    const allowed = [
      'PENDING',
      'ACTIVE',
      'CANCELLED',
      'ANNULLED',
      'PAID',
      'EXPIRED',
      'EXPIRED-PENDING',
      'DUE-SOON',
    ];

    if (!allowed.includes(sUpper)) {
      throw new Error(`Invalid status ${sRaw}`);
    }

    const normalized = sUpper.toLowerCase();

    await this.db
      .updateTable('dap')
      .set(
        ({
          status: normalized,
          // updated_at: new Date(), // NO existe columna en tu MySQL actual
          // updated_by: updatedBy ?? null, // descomenta si tienes esa columna
        } as unknown) as any,
      )
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
    async existsByIdAndUserRun(dapId: number, userRun: number): Promise<boolean> {
    const row = await this.db
      .selectFrom('dap')
      .select(['id'])
      .where('id', '=', Number(dapId))
      .where('user_run', '=', Number(userRun))
      .executeTakeFirst();

    return !!row;
  }
  async adminListPendingWithAttachments(): Promise<any[]> {
  const rows = await this.db
    .selectFrom('dap')
    .innerJoin('dap_attachments', 'dap_attachments.dap_id', 'dap.id')
    .select([
      'dap.id as id',
      'dap.user_run as userRun',
      'dap.status as status',
      'dap.type as type',
      'dap.currency_type as currencyType',
      'dap.days as days',
      'dap.initial_date as initialDate',
      'dap.due_date as dueDate',
      'dap.initial_amount as initialAmount',
      'dap.final_amount as finalAmount',
    ])
    .where('dap.status', '=', DapStatus.PENDING)
    .groupBy('dap.id')
    .orderBy('dap.due_date', 'asc')
    .execute();

  return (rows as any[]) ?? [];
}

async adminListExpiredPending(): Promise<any[]> {
  const rows = await this.db
    .selectFrom('dap')
    .select([
      'dap.id as id',
      'dap.user_run as userRun',
      'dap.status as status',
      'dap.type as type',
      'dap.currency_type as currencyType',
      'dap.days as days',
      'dap.initial_date as initialDate',
      'dap.due_date as dueDate',
      'dap.initial_amount as initialAmount',
      'dap.final_amount as finalAmount',
    ])
    .where('dap.status', '=', DapStatus.EXPIRED_PENDING)
    .orderBy('dap.due_date', 'asc')
    .execute();

  return (rows as any[]) ?? [];
}
}