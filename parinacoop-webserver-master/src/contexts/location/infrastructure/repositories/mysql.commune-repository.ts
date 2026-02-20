import { Inject, Injectable } from '@nestjs/common';
import { Database } from '@/database/database';

import { Commune } from '../../domain/models/Commune';
import { CommuneRepository } from '../../domain/ports/commune.repository';

type CommuneRow = {
  id: number;
  nombre: string;
  codigo_postal: string | number | null;
  region_id: number | null;
};

@Injectable()
export class MySqlCommuneRepository implements CommuneRepository {
  constructor(@Inject(Database) private readonly db: Database) {}

  async getByRegionId(regionId: number): Promise<Commune[]> {
    const rows = (await this.db
      .selectFrom('commune')
      .selectAll()
      .where('region_id', '=', Number(regionId))
      .orderBy('id', 'asc')
      .execute()) as unknown as CommuneRow[];

    return rows.map(
      (row) =>
        new Commune({
          id: Number(row.id),
          name: row.nombre,
          postalCode:
            typeof row.codigo_postal === 'string'
              ? Number(row.codigo_postal)
              : row.codigo_postal ?? 0,
          regionId: row.region_id ?? Number(regionId),
        }),
    );
  }
}