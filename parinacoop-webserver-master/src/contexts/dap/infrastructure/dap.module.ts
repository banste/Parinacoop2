import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
import { MySqlDapRepository } from './repositories/mysql.dap-repository';
import { MySqlParameterRepository } from './repositories/mysql.parameter-repository';

import { GetDapPdfsController } from './controller/get-dap-pdfs.controller';
import { GetDapInstructionsController } from './controller/get-dap-instructions.controller';

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

// Cancelled DAPs
import { GetCancelledDapsUseCase } from '@/contexts/dap/application/get-cancelled-daps/get-cancelled-daps.use-case';
import { AdminUpdateDapStatusController } from './http/admin-update-dap-status.controller';

type DbProvider = 'mysql' | 'postgres';

@Module({
  controllers: [
    GetDapsController,
    CreateDapController,
    SimulateDapController,
    GetDapPdfsController,
    GetDapInstructionsController,
    DapAttachmentsController,
    DapContractsController,

    // admin controllers
    AdminGetDapsController,
    AdminDapAttachmentsController,
    AdminDapContractsController,
    AdminActivateDapController,
    AdminUpdateDapStatusController,
  ],
  providers: [
    // use-cases
    GetDapsUseCase,
    CreateDapUseCase,
    SimulateDapUseCase,
    GetCancelledDapsUseCase,

    // register concrete implementations so Nest can inject them in factories
    PostgreSqlDapRepository,
    MySqlDapRepository,

    // DapRepository: select by env
    {
      provide: DapRepository,
      inject: [ConfigService, PostgreSqlDapRepository, MySqlDapRepository],
      useFactory: (
        config: ConfigService,
        pgRepo: PostgreSqlDapRepository,
        myRepo: MySqlDapRepository,
      ) => {
        const provider = (config.get<string>('DB_PROVIDER') as DbProvider) ?? 'postgres';
        return provider === 'mysql' ? myRepo : pgRepo;
      },
    },

    // ParameterRepository (solo MySQL por ahora; si luego quieres Postgres, se agrega selector igual)
    {
      provide: ParameterRepository,
      useClass: MySqlParameterRepository,
    },

    DapInstructionsRepository,
    DapInstructionsStore,
    DapPdfService,

    // ClientRepository (por ahora Postgres; si lo quieres MySQL, hay que implementar MySqlClientRepository y selector)
    {
      provide: ClientRepository,
      useClass: PostgreSqlClientRepository,
    },

    // Attachments (ojo: este repo usa returningAll(); en MySQL te fallará hasta que lo adaptemos)
    DapAttachmentsRepository,
    {
      provide: 'ATTACHMENTS_REPOSITORY',
      useClass: DapAttachmentsRepository,
    },
    DapAttachmentsService,

    // contracts (ojo: este repo usa returningAll(); en MySQL te fallará hasta que lo adaptemos)
    DapContractsRepository,
    DapContractsService,

    // Registrar localmente el repo admin (por ahora Postgres)
    PostgreSqlUserRepository,
    {
      provide: 'ADMIN_USER_REPOSITORY',
      useExisting: PostgreSqlUserRepository,
    },
  ],
})
export class DapModule {}