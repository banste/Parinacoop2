import { DapStatus } from '../dap-status.enum';
import { SDap } from './SDap';

export interface PrimitiveDap {
  id: number;
  userRun: number;
  type: string;
  currencyType: string;
  status: DapStatus;
  days: number;
  initialDate: Date;
  initialAmount: number;
  finalAmount: number;
  dueDate: Date;
  profit: number;
  interestRateInMonth: number;
  interestRateInPeriod: number;
  // NEW: internal id opcional (puede venir de dap_internal_ids)
  internalId?: string | null;
}

export class Dap {
  constructor(private attributes: PrimitiveDap) {}

  static create(userRun: number, simulatedDap: SDap): Dap {
    const sDapValue = simulatedDap.toValue();
    return new Dap({
      ...sDapValue,
      id: -1,
      initialDate: new Date(Date.now()),
      status: DapStatus.PENDING,
      userRun,
    });
  }

  toValue(): PrimitiveDap {
    return this.attributes;
  }
}