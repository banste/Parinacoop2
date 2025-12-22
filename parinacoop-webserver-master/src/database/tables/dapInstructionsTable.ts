import { Generated } from 'kysely';

export type DapInstructionsTable = {
  id_dap_instructions: Generated<number>;
  bank_name: string;
  account_type: string;
  account_number: string;
  account_holder_name: string;
  account_holder_rut: string;
  email: string | null;
  description: string;
  updated_at: Date;
};
