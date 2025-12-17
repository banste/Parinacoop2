import { Generated } from 'kysely';

export interface CommuneTable {
  id: Generated<number>;
  name: string;
  postal_code: number;
  region_id: number;
}
