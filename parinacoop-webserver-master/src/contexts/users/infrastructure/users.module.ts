import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import { KyselyUserRepository } from './repositories/kysely-user.repository';
import { USER_REPOSITORY } from '../domain/repositories/user-repository.interface';
import { UserApplicationService } from '../application/services/user-application.service';

// Nota: NO importamos DatabaseModule aquí porque ya está registrado globalmente
// en AppModule mediante DatabaseModule.forRootAsync(...) y exporta el provider Database.

@Module({
  controllers: [UsersController],
  providers: [
    UserApplicationService,
    KyselyUserRepository,
    { provide: USER_REPOSITORY, useExisting: KyselyUserRepository },
  ],
  exports: [UserApplicationService],
})
export class UsersModule {}