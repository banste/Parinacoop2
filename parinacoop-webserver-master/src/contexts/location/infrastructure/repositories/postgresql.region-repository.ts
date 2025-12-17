import { Database } from '@/database/database';
import { Region } from '../../domain/models/Region';
import { RegionRepository } from '../../domain/ports/region.repository';
import { Injectable } from '@/contexts/shared/dependency-injection/injectable';

@Injectable()
export class PostgreSqlRegionRepository implements RegionRepository {
  constructor(private db: Database) {}
  async getAll(): Promise<Region[]> {
    const result = await this.db
      .selectFrom('region')
      .select([
        'id',
        'name',
        'roman_number as romanNumber',
        'number',
        'abbreviation',
      ])
      .execute();
    return result.map((row) => new Region(row));
  }
}
