import { Inject, Injectable } from '@nestjs/common';
import { Database } from '@/database/database';

import { Region } from '../../domain/models/Region';
import { RegionRepository } from '../../domain/ports/region.repository';

type RegionRow = {
  id_region: number;
  nombre: string;
  numero_romano: string | null;
  numero: number | null;
  abreviacion: string | null;
};

@Injectable()
export class MySqlRegionRepository implements RegionRepository {
  constructor(@Inject(Database) private readonly db: Database) {}

  async getAll(): Promise<Region[]> {
    // Usamos selectAll() para evitar problemas de typing con string[]
    const rows = (await this.db
      .selectFrom('region')
      .selectAll()
      .orderBy('id', 'asc')
      .execute()) as unknown as RegionRow[];

    return rows.map(
      (row) =>
        new Region({
          id: Number(row.id_region),
          name: row.nombre,
          romanNumber: row.numero_romano ?? '',
          number: row.numero ?? 0,
          abbreviation: row.abreviacion ?? '',
        }),
    );
  }
}