import { Module } from '@nestjs/common';

import { ClientRepository } from '../domain/ports/client.repository';
import { GetProfileUseCase, UpdateProfileUseCase } from '../application';

import { PostgreSqlClientRepository } from './repositories/postgresql.client-repository';
import { GetProfileController, UpdateProfileController } from './http';

@Module({
  controllers: [GetProfileController, UpdateProfileController],
  providers: [
    GetProfileUseCase,
    UpdateProfileUseCase,
    {
      provide: ClientRepository,
      useClass: PostgreSqlClientRepository,
    },
  ],
})
export class ClientProfileModule {}
