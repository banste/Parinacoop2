import { Generated } from 'kysely';

export interface ClientProfileTable {
  id: Generated<number>;
  user_run: number;
  document_number: string;
  email: string;
  names: string;
  first_last_name: string;
  second_last_name: string;
  cellphone: string;
  created_at?: Date;
  updated_at?: Date;
}
