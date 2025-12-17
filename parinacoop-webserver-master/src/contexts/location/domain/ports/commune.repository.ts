import { Commune } from '../models/Commune';

export abstract class CommuneRepository {
  abstract getByRegionId(regionId: number): Promise<Commune[]>;
}
