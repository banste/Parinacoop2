import { Injectable } from '@/contexts/shared/dependency-injection/injectable';
import { Database } from '@/database/database';
import { CommuneRepository } from '../../domain/ports/commune.repository';
import { Commune } from '../../domain/models/Commune';

@Injectable()
export class PostgreSqlCommuneRepository implements CommuneRepository {
  constructor(private db: Database) {}

  async getByRegionId(regionId: number): Promise<Commune[]> {
    const result = await this.db
      .selectFrom('commune')
      .where('region_id', '=', regionId)
      .select([
        'id',
        'name',
        'postal_code as postalCode',
        'region_id as regionId',
      ])
      .execute();

    return result.map((row) => new Commune(row));
  }
}
