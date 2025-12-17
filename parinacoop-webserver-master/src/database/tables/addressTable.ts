import { Generated } from 'kysely';

export interface AddressTable {
  id: Generated<number>;
  commune_id: number;
  user_run: number;
  type_address: string;
  street: string;
  number: number;
  detail: string;
}
