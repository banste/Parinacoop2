import { Generated } from 'kysely';

export interface AddressTable {
  id: Generated<number>;
  commune_id: number;
  user_run: number;
  type_address: string;
  street: string;
  number: number;
  detail: string;

  // timestamps creados en la migración
  created_at: Date;
  updated_at: Date;
}