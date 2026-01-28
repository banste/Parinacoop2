import { Generated } from 'kysely';

/**
 * Tabla: dap_internal_ids
 *
 * Columns:
 * - id              : serial PK
 * - dap_id          : FK -> dap.id
 * - internal_id     : texto con la id interna asignada por admin
 * - created_by_run  : FK -> user.run (admin que asignó)
 * - created_at      : timestamp DEFAULT now()
 */
export interface DapInternalIdsTable {
  id: Generated<number>;
  dap_id: number;
  internal_id: string;
  created_by_run: number;
  created_at: Generated<Date>;
}