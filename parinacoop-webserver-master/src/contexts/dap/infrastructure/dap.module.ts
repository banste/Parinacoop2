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

// Admin user repo registered locally to avoid importing AdminModule
import { PostgreSqlUserRepository } from '@/contexts/admin/infrastructure/persistence/postgresql.user-repository';

// Contracts
import { DapContractsRepository } from './repositories/dap-contracts.repository';
import { DapContractsService } from './dap-contracts.service';
import { DapContractsController } from './controller/dap-contracts.controller';

// Admin controllers
import { AdminGetDapsController } from './http/admin-get-daps.controller';
import { AdminDapAttachmentsController } from './http/admin-dap-attachments.controller';
import { AdminDapContractsController } from './http/admin-dap-contracts.controller';
import { AdminActivateDapController } from './http/admin-activate-dap.controller';

// Nuevo use-case para DAPs cancelados
import { GetCancelledDapsUseCase } from '@/contexts/dap/application/get-cancelled-daps/get-cancelled-daps.use-case';

@Module({
  controllers: [
    GetDapsController,
    CreateDapController,
    SimulateDapController,
    GetDapPdfsController,
    DapAttachmentsController,
    DapContractsController,
    // admin controllers
    AdminGetDapsController,
    AdminDapAttachmentsController,
    AdminDapContractsController,
    AdminActivateDapController,
  ],
  providers: [
    // use-cases
    GetDapsUseCase,
    CreateDapUseCase,
    SimulateDapUseCase,
    GetCancelledDapsUseCase, // <-- registrado aquí

    // repositorios y tokens
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

    // Attachments
    DapAttachmentsRepository,
    {
      provide: 'ATTACHMENTS_REPOSITORY',
      useClass: DapAttachmentsRepository,
    },
    DapAttachmentsService,

    // contracts
    DapContractsRepository,
    DapContractsService,
    DapContractsController,

    // Registrar localmente el repo admin y exponerlo con token 'ADMIN_USER_REPOSITORY'
    PostgreSqlUserRepository,
    {
      provide: 'ADMIN_USER_REPOSITORY',
      useExisting: PostgreSqlUserRepository,
    },
  ],
})
export class DapModule {}