import { Region } from '../models/Region';

export abstract class RegionRepository {
  abstract getAll(): Promise<Region[]>;
}
