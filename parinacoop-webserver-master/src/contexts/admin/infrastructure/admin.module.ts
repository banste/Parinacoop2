import { Module } from '@nestjs/common';
import { UserRepository } from '../domain/ports/user.repository';

import {
  CreateClientUseCase,
  CreateFirstAdminUseCase,
  GetDapInstructionsUseCase,
  UpdateDapInstructionsUseCase,
} from '../application';

import {
  CreateClientController,
  CreateFirstAdminController,
  DapInstructionsAdminController,
} from './http';

import { PostgreSqlUserRepository } from './persistence/postgresql.user-repository';

// Opciones seguras: registramos tanto el store en memoria (existente)
// como el repositorio DB para que puedas migrar gradualmente.
import { DapInstructionsStore } from '../../dap/infrastructure/dap-instructions.store';
import { DapInstructionsRepository } from '@/database/repositories/dap-instructions.repository';

@Module({
  controllers: [
    CreateClientController,
    CreateFirstAdminController,
    DapInstructionsAdminController,
  ],
  providers: [
    // use cases admin existentes
    CreateClientUseCase,
    CreateFirstAdminUseCase,

    // use cases para instructivo DAP
    GetDapInstructionsUseCase,
    UpdateDapInstructionsUseCase,

    // Mantener la store en memoria para compatibilidad inmediata
    DapInstructionsStore,

    // Registrar además el repositorio que accede a la tabla dap_instructions (DB)
    // (esto permite inyectarlo en los use-cases y migrar a DB)
    DapInstructionsRepository,

    // repositorio usuario (existente)
    {
      provide: UserRepository,
      useClass: PostgreSqlUserRepository,
    },
  ],
})
export class AdminModule {}