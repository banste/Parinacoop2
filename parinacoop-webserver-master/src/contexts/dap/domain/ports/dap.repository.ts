import { Dap } from '../models/Dap';

export abstract class DapRepository {
  abstract create(dap: Dap): Promise<Dap>;
  abstract getDapsByUserRun(run: number): Promise<Dap[]>;

  // ✅ para PDF / validaciones de pertenencia
  abstract findByIdAndUserRun(id: number, run: number): Promise<Dap | null>;

  /**
   * ✅ NUEVO: helper de autorización (más liviano que traer toda la entidad).
   * Si ya tienes findByIdAndUserRun implementado, puedes implementar este
   * llamándolo por debajo.
   */
  abstract existsByIdAndUserRun(id: number, run: number): Promise<boolean>;

  abstract updateStatus(dapId: number, status: string, updatedBy?: number): Promise<void>;
}