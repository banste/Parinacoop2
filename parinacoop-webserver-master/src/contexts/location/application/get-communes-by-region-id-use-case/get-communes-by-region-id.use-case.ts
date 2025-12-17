import { Injectable } from '@/contexts/shared/dependency-injection/injectable';
import { CommuneRepository } from '../../domain/ports/commune.repository';
import { PrimitiveCommune } from '../../domain/models/Commune';
import { GetCommunesByRegionIdDto } from './get-communes-by-region-id.dto';

@Injectable()
export class GetCommunesByRegionIdUseCase {
  constructor(private communeRepository: CommuneRepository) {}

  async execute(
    dto: GetCommunesByRegionIdDto,
  ): Promise<{ communes: PrimitiveCommune[] }> {
    const result = await this.communeRepository.getByRegionId(dto.regionId);

    return { communes: result.map((commune) => commune.toValue()) };
  }
}
