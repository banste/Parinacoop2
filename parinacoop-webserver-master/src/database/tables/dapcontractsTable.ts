import { Generated } from 'kysely';

export interface DapContractsTable {
  id: Generated<number>;
  dap_id: number;
  filename: string;
  storage_path: string;
  uploaded_by_run: number;
  created_at?: Date;
}