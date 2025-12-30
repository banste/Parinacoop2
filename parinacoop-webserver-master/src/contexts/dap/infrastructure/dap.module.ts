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
import { DapInstructionsStore } from '../infrastructure/dap-instructions.store';

// Client profile (ya tenías)
import { ClientRepository } from '@/contexts/client-profile/domain/ports/client.repository';
import { PostgreSqlClientRepository } from '@/contexts/client-profile/infrastructure/repositories/postgresql.client-repository';

// ---- Nuevos imports para attachments y contracts ----
import { DapAttachmentsRepository } from './repositories/dap-attachments.repository';
import DapAttachmentsService from './dap-attachments.service';
import { DapAttachmentsController } from './controller/dap-attachments.controller';

import { DapContractsRepository } from '@/contexts/dap/infrastructure/repositories/dap-contracts.repository';
import { DapContractsService } from './dap-contracts.service';
import { DapContractsController } from './controller/dap-contracts.controller';
// ----------------------------------------------------

@Module({
  controllers: [
    GetDapsController,
    CreateDapController,
    SimulateDapController,
    GetDapPdfsController,
    // Controllers nuevos
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

    // ClientRepository para obtener perfil cliente (ya lo tenías)
    {
      provide: ClientRepository,
      useClass: PostgreSqlClientRepository,
    },

    // Providers nuevos: attachments
    DapAttachmentsRepository,
    DapAttachmentsService,

    // Providers nuevos: contracts
    DapContractsRepository,
    DapContractsService,
  ],
})
export class DapModule {}