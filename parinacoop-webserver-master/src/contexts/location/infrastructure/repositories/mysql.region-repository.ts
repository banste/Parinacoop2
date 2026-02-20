import { Inject, Injectable } from '@nestjs/common';
import { Database } from '@/database/database';

import { Region } from '../../domain/models/Region';
import { RegionRepository } from '../../domain/ports/region.repository';

type RegionRow = {
  id: number;
  name: string;
  roman_number: string;
  number: number;
  abbreviation: string;
};

@Injectable()
export class MySqlRegionRepository implements RegionRepository {
  constructor(@Inject(Database) private readonly db: Database) {}

  async getAll(): Promise<Region[]> {
    const rows = (await this.db
      .selectFrom('region')
      .select(['id', 'name', 'roman_number', 'number', 'abbreviation'])
      .orderBy('id', 'asc')
      .execute()) as unknown as RegionRow[];

    return rows.map(
      (r) =>
        new Region({
          id: Number(r.id),
          name: r.name,
          romanNumber: r.roman_number ?? '',
          number: r.number ?? 0,
          abbreviation: r.abbreviation ?? '',
        }),
    );
  }

  // Si tu port también define getById, agrégalo consistente
  async getById(regionId: number): Promise<Region | null> {
    const r = (await this.db
      .selectFrom('region')
      .select(['id', 'name', 'roman_number', 'number', 'abbreviation'])
      .where('id', '=', Number(regionId))
      .executeTakeFirst()) as unknown as RegionRow | undefined;

    if (!r) return null;

    return new Region({
      id: Number(r.id),
      name: r.name,
      romanNumber: r.roman_number ?? '',
      number: r.number ?? 0,
      abbreviation: r.abbreviation ?? '',
    });
  }
}