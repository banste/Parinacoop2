import { Module } from '@nestjs/common';

import {
  CreateDapUseCase,
  GetDapsUseCase,
  SimulateDapUseCase,
} from '../application';

import { DapRepository } from '../domain/ports/dap.repository';
import { ParameterRepository } from '../domain/ports/parameter.repository';

import {
  CreateDapController,
  GetDapsController,
  SimulateDapController,
} from './http';

import { PostgreSqlDapRepository } from './repositories/postgresql.dap-repository';
import { MySqlParameterRepository } from './repositories/mysql.parameter-repository';

import { GetDapPdfsController } from './controller/get-dap-pdfs.controller';

import { DapInstructionsRepository } from '@/database/repositories/dap-instructions.repository';
import { DapPdfService } from '@/archives/pdf/dap-pdf.service';
import { DapInstructionsStore } from './dap-instructions.store';

@Module({
  controllers: [
    GetDapsController,
    CreateDapController,
    SimulateDapController,
    GetDapPdfsController,
  ],
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
    DapInstructionsRepository,
    DapPdfService,
    DapInstructionsStore,
  ],
})
export class DapModule {}
