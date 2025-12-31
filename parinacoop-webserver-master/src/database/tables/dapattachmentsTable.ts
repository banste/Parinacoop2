import { Generated } from 'kysely';

export interface DapAttachmentsTable {
  id: Generated<number>;
  dap_id: number;
  type: 'receipt' | 'signed_document' | string;
  filename: string;
  storage_path: string;
  uploaded_by_run: number;
  created_at?: Date;
}