import { Generated } from 'kysely';

export interface ParameterTable {
  id: Generated<number>;
  minimum_days: number;
  maximum_days: number;
  interest_rate_base: number;
}
