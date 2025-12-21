import { CuentaAhorro } from '../models/CuentaAhorro';

export abstract class CuentaAhorroRepository {
  abstract findByUserRun(run: number): Promise<any>;
}