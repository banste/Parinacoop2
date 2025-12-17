import { Module } from '@nestjs/common';

import { RegionRepository } from '../domain/ports/region.repository';
import { CommuneRepository } from '../domain/ports/commune.repository';

import {
  GetCommunesByRegionIdUseCase,
  GetRegionsUseCase,
} from '../application';

import { GetCommunesByRegionIdController, GetRegionsController } from './http';

import { PostgreSqlRegionRepository } from './repositories/postgresql.region-repository';
import { PostgreSqlCommuneRepository } from './repositories/postgresql.commune-repository';

@Module({
  controllers: [GetRegionsController, GetCommunesByRegionIdController],
  providers: [
    GetRegionsUseCase,
    GetCommunesByRegionIdUseCase,
    {
      provide: RegionRepository,
      useClass: PostgreSqlRegionRepository,
    },
    {
      provide: CommuneRepository,
      useClass: PostgreSqlCommuneRepository,
    },
  ],
})
export class LocationModule {}
