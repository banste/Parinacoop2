import { Module } from '@nestjs/common';

import {
  CreateDapUseCase,
  GetDapsUseCase,
  SimulateDapUseCase,
} from '../application';

import { DapRepository } from '../domain/ports/dap.repository';

import {
  CreateDapController,
  GetDapsController,
  SimulateDapController,
} from './http';

import { PostgreSqlDapRepository } from './repositories/postgresql.dap-repository';
import { ParameterRepository } from '../domain/ports/parameter.repository';
import { MySqlParameterRepository } from './repositories/mysql.parameter-repository';

@Module({
  controllers: [GetDapsController, CreateDapController, SimulateDapController],
  providers: [
    GetDapsUseCase,
    CreateDapUseCase,
    SimulateDapUseCase,
    {
      provide: DapRepository,
      useClass: PostgreSqlDapRepository,
    },
    {
      provide: ParameterRepository,
      useClass: MySqlParameterRepository,
    },
  ],
})
export class DapModule {}
