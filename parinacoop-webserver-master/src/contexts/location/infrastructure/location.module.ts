import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { RegionRepository } from '../domain/ports/region.repository';
import { CommuneRepository } from '../domain/ports/commune.repository';

import { GetCommunesByRegionIdUseCase, GetRegionsUseCase } from '../application';
import { GetCommunesByRegionIdController, GetRegionsController } from './http';

import { PostgreSqlRegionRepository } from './repositories/postgresql.region-repository';
import { PostgreSqlCommuneRepository } from './repositories/postgresql.commune-repository';
import { MySqlRegionRepository } from './repositories/mysql.region-repository';
import { MySqlCommuneRepository } from './repositories/mysql.commune-repository';

type DbProvider = 'mysql' | 'postgres';

@Module({
  controllers: [GetRegionsController, GetCommunesByRegionIdController],
  providers: [
    GetRegionsUseCase,
    GetCommunesByRegionIdUseCase,

    // Registramos ambas implementaciones para que Nest las pueda instanciar
    PostgreSqlRegionRepository,
    PostgreSqlCommuneRepository,
    MySqlRegionRepository,
    MySqlCommuneRepository,

    // Selector por env: RegionRepository
    {
      provide: RegionRepository,
      inject: [ConfigService, PostgreSqlRegionRepository, MySqlRegionRepository],
      useFactory: (
        config: ConfigService,
        pgRepo: PostgreSqlRegionRepository,
        myRepo: MySqlRegionRepository,
      ) => {
        const provider = (config.get<string>('DB_PROVIDER') as DbProvider) ?? 'postgres';
        return provider === 'mysql' ? myRepo : pgRepo;
      },
    },

    // Selector por env: CommuneRepository
    {
      provide: CommuneRepository,
      inject: [ConfigService, PostgreSqlCommuneRepository, MySqlCommuneRepository],
      useFactory: (
        config: ConfigService,
        pgRepo: PostgreSqlCommuneRepository,
        myRepo: MySqlCommuneRepository,
      ) => {
        const provider = (config.get<string>('DB_PROVIDER') as DbProvider) ?? 'postgres';
        return provider === 'mysql' ? myRepo : pgRepo;
      },
    },
  ],
})
export class LocationModule {}