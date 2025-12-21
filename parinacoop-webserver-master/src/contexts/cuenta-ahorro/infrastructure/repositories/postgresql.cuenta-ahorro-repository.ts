import { Injectable } from '@nestjs/common';
import { Database } from '@/database/database';
import { CuentaAhorroRepository } from '../../domain/ports/cuenta-ahorro.repository';
import { CuentaAhorro } from '../../domain/models/CuentaAhorro';

@Injectable()
export class PostgreSqlCuentaAhorroRepository extends CuentaAhorroRepository {
  constructor(private db: Database) {
    super();
  }

  async findByUserRun(run: number): Promise<CuentaAhorro[]> {
    const result = await this.db
      .selectFrom('cuenta_ahorro')
      .where('user_run', '=', run)
      .selectAll()
      .execute();
    result.map(row => new CuentaAhorro({
  id: row.id,
  userRun: row.user_run, // <--- aquí transformas!
  saldo: row.saldo,
  tipo: row.tipo,
  fecha_apertura: row.fecha_apertura
    }));
    return result.map(row => new CuentaAhorro({...row, userRun: row.user_run}));
  }
}