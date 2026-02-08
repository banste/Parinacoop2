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

// Attachments: repository implementation (Postgres-backed)
import { DapAttachmentsRepository } from './repositories/dap-attachments.repository';
import { DapAttachmentsService } from './dap-attachments.service';
import { DapAttachmentsController } from './controller/dap-attachments.controller';

// Admin user repo (registramos localmente para evitar importar AdminModule y circularidad)
import { PostgreSqlUserRepository } from '@/contexts/admin/infrastructure/persistence/postgresql.user-repository';
// nota: el token que usaremos para inyectar aquí es 'ADMIN_USER_REPOSITORY'

/* Contracts */
import { DapContractsRepository } from './repositories/dap-contracts.repository';
import { DapContractsService } from './dap-contracts.service';
import { DapContractsController } from './controller/dap-contracts.controller';

// Admin controllers
import { AdminGetDapsController } from './http/admin-get-daps.controller';
import { AdminDapAttachmentsController } from './http/admin-dap-attachments.controller';
import { AdminDapContractsController } from './http/admin-dap-contracts.controller';
import { AdminActivateDapController } from './http/admin-activate-dap.controller';

// NUEVO: use-case para DAPs cancelados
import { GetCancelledDapsUseCase } from '@/contexts/dap/application/get-cancelled-daps/get-cancelled-daps.use-case';

@Module({
  controllers: [
    GetDapsController,
    CreateDapController,
    SimulateDapController,
    GetDapPdfsController,
    DapAttachmentsController,
    DapContractsController,
    // Registrar controladores admin
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
    GetCancelledDapsUseCase, // <-- nuevo use-case registrado

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

    // Attachments: Postgres-backed repository (persist to DB)
    DapAttachmentsRepository,
    {
      provide: 'ATTACHMENTS_REPOSITORY',
      useClass: DapAttachmentsRepository,
    },
    DapAttachmentsService,

    // contracts
    DapContractsRepository,
    DapContractsService,

    // Registrar localmente el repo de usuarios admin y exponerlo con el token 'ADMIN_USER_REPOSITORY'
    PostgreSqlUserRepository,
    {
      provide: 'ADMIN_USER_REPOSITORY',
      useExisting: PostgreSqlUserRepository,
    },
  ],
})
export class DapModule {}