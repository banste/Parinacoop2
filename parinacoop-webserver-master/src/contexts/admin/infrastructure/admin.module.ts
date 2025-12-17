import { Module } from '@nestjs/common';
import { UserRepository } from '../domain/ports/user.repository';

import { CreateClientUseCase, CreateFirstAdminUseCase } from '../application';

import { CreateClientController, CreateFirstAdminController } from './http';
import { PostgreSqlUserRepository } from './persistence/postgresql.user-repository';

@Module({
  controllers: [CreateClientController, CreateFirstAdminController],
  providers: [
    CreateClientUseCase,
    CreateFirstAdminUseCase,
    {
      provide: UserRepository,
      useClass: PostgreSqlUserRepository,
    },
  ],
})
export class AdminModule {}
