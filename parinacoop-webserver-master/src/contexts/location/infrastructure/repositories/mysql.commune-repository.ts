import { Inject, Injectable } from '@nestjs/common';
import { Database } from '@/database/database';

import { Commune } from '../../domain/models/Commune';
import { CommuneRepository } from '../../domain/ports/commune.repository';

type CommuneRow = {
  id: number;
  name: string;
  postal_code: string;
  region_id: number;
};

@Injectable()
export class MySqlCommuneRepository implements CommuneRepository {
  constructor(@Inject(Database) private readonly db: Database) {}

  async getByRegionId(regionId: number): Promise<Commune[]> {
    const rows = (await this.db
      .selectFrom('commune')
      .select(['id', 'name', 'postal_code', 'region_id'])
      .where('region_id', '=', Number(regionId))
      .orderBy('id', 'asc')
      .execute()) as unknown as CommuneRow[];

    return rows.map(
      (r) =>
        new Commune({
          id: Number(r.id),
          name: r.name,
          postalCode: Number(r.postal_code ?? 0),
          regionId: Number(r.region_id),
        }),
    );
  }
}