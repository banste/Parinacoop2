import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';

import { Database } from '@/database/database';

import { Dap } from '@/contexts/dap/domain/models/Dap';
import { DapRepository } from '@/contexts/dap/domain/ports/dap.repository';
import { DapStatus } from '@/contexts/dap/domain/dap-status.enum';

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

  // Obtener todos los DAP de un usuario (EXCLUYENDO los ANNULLED)
  async getDapsByUserRun(run: number): Promise<Dap[]> {
    // Ahora hacemos LEFT JOIN con dap_internal_ids para traer internal_id si existe
    const result = await this.db
      .selectFrom('dap')
      .leftJoin('dap_internal_ids', 'dap_internal_ids.dap_id', 'dap.id')
      .where('user_run', '=', run)
      // comparación case-insensitive para excluir anuladas (evita problemas por mayúsculas)
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
        // agregamos internal_id (alias internalId) para que el frontend lo reciba en camelCase
        'dap_internal_ids.internal_id as internalId',
      ])
      .execute();

    // Mapear cada fila a la entidad Dap — la propiedad internalId se pasa en el objeto row
    return result.map((row) => new Dap(row));
  }

  // Nuevo: obtener SOLO DAPs con status = CANCELLED para un usuario (case-insensitive)
  async getCancelledDapsByUserRun(run: number): Promise<Dap[]> {
    const rows = await this.db
      .selectFrom('dap')
      .leftJoin('dap_internal_ids', 'dap_internal_ids.dap_id', 'dap.id')
      .where('user_run', '=', run)
      // comparacion case-insensitive: lower(dap.status) = 'cancelled'
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

  // Busca un DAP por internal_id (usa la tabla dap_internal_ids creada por migración)
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

  // ------------------------------------------------------------
  // Nuevos métodos para soportar activación por internal_id
  // (findInternalIdByDapId, updateStatusById, attachInternalId)
  // ------------------------------------------------------------

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

  // Actualiza el estado (status) por id y devuelve la entidad actualizada
  // Acepta DapStatus o string; casteamos al tipo que Kysely espera.
  async updateStatusById(id: number, status: DapStatus | string): Promise<Dap | null> {
    const update = await this.db
      .updateTable('dap')
      // Kysely espera una ValueExpression para columnas con tipos específicos;
      // para evitar error de tipos en este punto casteamos el valor.
      .set({ status: status as any })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!update) return null;

    const row = {
      id: update.id,
      userRun: update.user_run,
      type: update.type,
      currencyType: update.currency_type,
      days: update.days,
      status: update.status,
      initialDate: update.initial_date,
      initialAmount: update.initial_amount,
      dueDate: update.due_date,
      profit: update.profit,
      interestRateInPeriod: update.interest_rate_in_period,
      interestRateInMonth: update.interest_rate_in_month,
      finalAmount: update.final_amount,
    };

    return new Dap(row);
  }

  // Inserta o actualiza un registro en dap_internal_ids para auditar la asignación
  async attachInternalId(dapId: number, internalId: string, createdByRun: number): Promise<void> {
    // SELECT previo para decidir INSERT o UPDATE (manejo sencillo y portable)
    const existing = await this.db
      .selectFrom('dap_internal_ids')
      .where('internal_id', '=', internalId)
      .select(['id', 'dap_id']) // usar array de columnas (corrección TS)
      .executeTakeFirst();

    if (existing) {
      // Si existe, actualizamos la fila para asociarla al dapId y registrar quién lo hizo.
      await this.db
        .updateTable('dap_internal_ids')
        .set({
          dap_id: dapId,
          created_by_run: createdByRun,
          // actualizar la marca temporal a NOW() en la DB usando sql`now()`
          // casteo 'as any' porque .set espera el tipo exacto de la columna según la interfaz
          created_at: sql`now()`,
        } as any)
        .where('internal_id', '=', internalId)
        .execute();
      return;
    }

    // Si no existe, insertamos (la columna created_at puede ser omitida si DB tiene DEFAULT now())
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
      // fallback: en caso de carrera (insert duplicado), hacemos un update
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