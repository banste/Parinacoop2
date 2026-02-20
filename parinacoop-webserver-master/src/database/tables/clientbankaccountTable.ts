import { Generated } from 'kysely';

export interface ClientBankAccountTable {
  user_run: number; // PK (1 cuenta por usuario)
  rut_owner: string;
  bank_code: string;
  bank_name: string;
  account_type: string;
  account_number: string;
  email?: string | null;
  created_at?: Generated<Date>;
  updated_at?: Generated<Date>;
}