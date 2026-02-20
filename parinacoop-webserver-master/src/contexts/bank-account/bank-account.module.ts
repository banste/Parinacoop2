import { Module } from '@nestjs/common';

import { ClientRepository } from '@/contexts/client-profile/domain/ports/client.repository';
import { PostgreSqlClientRepository } from '@/contexts/client-profile/infrastructure/repositories/postgresql.client-repository';

import { ClientBankAccountController } from '/infrastructure//http/client-bank-account.controller';
import { MySqlClientBankAccountRepository } from '/infrastructure/repositories/mysql.client-bank-account.repository';

@Module({
  controllers: [ClientBankAccountController],
  providers: [
    MySqlClientBankAccountRepository,
    {
      provide: ClientRepository,
      useClass: PostgreSqlClientRepository,
    },
  ],
})
export class BankAccountModule {}