import { Injectable } from '@/contexts/shared/dependency-injection/injectable';

import { RegionRepository } from '../../domain/ports/region.repository';
import { PrimitiveRegion } from '../../domain/models/Region';

import { GetRegionsDto } from './get-regions.dto';

@Injectable()
export class GetRegionsUseCase {
  constructor(private regionRepository: RegionRepository) {}

  async execute({}: GetRegionsDto): Promise<{ regions: PrimitiveRegion[] }> {
    const regions = await this.regionRepository.getAll();
    return {
      regions: regions.map((region) => region.toValue()),
    };
  }
}
