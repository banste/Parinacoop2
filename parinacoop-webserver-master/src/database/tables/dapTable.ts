import { DapStatus } from '@/contexts/dap/domain/dap-status.enum';
import { Generated } from 'kysely';

export interface DapTable {
  id: Generated<number>;
  user_run: number;
  type: string;
  currency_type: string;
  status: DapStatus;
  days: number;
  initial_date: Date;
  initial_amount: number;
  due_date: Date;
  final_amount: number;
  profit: number;
  interest_rate_in_period: number;
  interest_rate_in_month: number;
}
