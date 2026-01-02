import { DapStatus } from './dap-status.enum';
import { DapType } from './dap-type.enum';

export class Dap {
  id!: number;
  userRun!: number;
  type?: DapType | string | null;
  currencyType?: string | null;
  status?: DapStatus | string | null;

  // Campos que pueden venir vacíos → los dejamos opcionales y admiten null
  days?: number | null;
  initialDate?: Date | null;
  initialAmount?: number | null;
  finalAmount?: number | null;
  dueDate?: Date | null;
  profit?: number | null;
  interestRateInMonth?: number | null;
  interestRateInPeriod?: number | null;
}