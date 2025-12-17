import { DapStatus } from './dap-status.enum';
import { DapType } from './dap-type.enum';

export class Dap {
  id!: number;
  userRun!: number;
  type!: DapType;
  currencyType!: string;
  status!: DapStatus;
  days!: number;
  initialDate!: Date;
  initialAmount!: number;
  finalAmount!: number;
  dueDate!: Date;
  profit!: number;
  interestRateInMonth!: number;
  interestRateInPeriod!: number;
}
