import { Dap } from '../models/Dap';

export abstract class DapRepository {
  abstract create(dap: Dap): Promise<Dap>;
  abstract getDapsByUserRun(run: number): Promise<Dap[]>;
}
