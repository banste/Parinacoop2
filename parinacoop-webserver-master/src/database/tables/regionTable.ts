import { Generated } from 'kysely';

export interface RegionTable {
  id: Generated<number>;
  name: string;
  roman_number: string;
  number: number;
  abbreviation: string;
}
