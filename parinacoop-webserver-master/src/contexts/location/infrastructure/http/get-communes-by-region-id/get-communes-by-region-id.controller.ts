import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { GetCommunesByRegionIdUseCase } from '@/contexts/location/application/get-communes-by-region-id-use-case/get-communes-by-region-id.use-case';
import { PrimitiveCommune } from '@/contexts/location/domain/models/Commune';

@ApiTags('Localización')
@Controller('regions')
export class GetCommunesByRegionIdController {
  constructor(
    private getCommuneByRegionIdUseCase: GetCommunesByRegionIdUseCase,
  ) {}

  @Get(':regionId/communes')
  async run(
    @Param('regionId', ParseIntPipe) regionId: number,
  ): Promise<{ communes: PrimitiveCommune[] }> {
    return this.getCommuneByRegionIdUseCase.execute({ regionId });
  }
}
