import { Dap } from '../models/Dap';

export abstract class DapRepository {
  abstract create(dap: Dap): Promise<Dap>;
  abstract getDapsByUserRun(run: number): Promise<Dap[]>;

  // ✅ NUEVO: para PDF
  abstract findByIdAndUserRun(id: number, run: number): Promise<Dap | null>;
  abstract updateStatus(dapId: number, status: string, updatedBy?: number): Promise<void>;
}
