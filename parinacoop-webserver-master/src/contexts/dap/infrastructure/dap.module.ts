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

// Client profile
import { ClientRepository } from '@/contexts/client-profile/domain/ports/client.repository';
import { PostgreSqlClientRepository } from '@/contexts/client-profile/infrastructure/repositories/postgresql.client-repository';

// Attachments
import { DapAttachmentsRepository } from './repositories/dap-attachments.repository';
import { DapAttachmentsService } from './dap-attachments.service';
import { DapAttachmentsController } from './controller/dap-attachments.controller';

// Contracts
import { DapContractsRepository } from './repositories/dap-contracts.repository';
import { DapContractsService } from './dap-contracts.service';
import { DapContractsController } from './controller/dap-contracts.controller';

@Module({
  controllers: [
    GetDapsController,
    CreateDapController,
    SimulateDapController,
    GetDapPdfsController,
    DapAttachmentsController,
    DapContractsController,
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
    DapInstructionsStore,
    DapPdfService,

    {
      provide: ClientRepository,
      useClass: PostgreSqlClientRepository,
    },

    // attachments: register concrete repository and token expected by the service
    DapAttachmentsRepository,
    {
      provide: 'ATTACHMENTS_REPOSITORY',
      useClass: DapAttachmentsRepository,
    },
    DapAttachmentsService,

    // contracts
    DapContractsRepository,
    DapContractsService,
  ],
})
export class DapModule {}