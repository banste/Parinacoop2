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

// ✅ IMPORTA el store desde donde lo creaste.
// Si lo creaste en contexts/dap, pon la ruta exacta.
// EJEMPLO:
// import { DapInstructionsStore } from '../../dap/infrastructure/dap-instructions.store';

// ⚠️ Si aún NO tienes store, abajo te doy un “store mínimo” para que compile y luego lo conectas a parámetros.
import { DapInstructionsStore } from '../../dap/infrastructure/dap-instructions.store';

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

    // ✅ use cases nuevos para instructivo DAP
    GetDapInstructionsUseCase,
    UpdateDapInstructionsUseCase,

    // ✅ store para guardar/leer config
    DapInstructionsStore,

    // repositorio usuario (existente)
    {
      provide: UserRepository,
      useClass: PostgreSqlUserRepository,
    },
  ],
})
export class AdminModule {}
