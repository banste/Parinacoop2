import { Generated } from 'kysely';

export interface CommuneTable {
  id: Generated<number>;
  nombre: string;
  codigo_postal: string; // en dump es varchar(20)
  region_id: number | null;
}