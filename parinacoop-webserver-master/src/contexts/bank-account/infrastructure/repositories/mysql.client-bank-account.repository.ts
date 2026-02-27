import { Injectable } from '@nestjs/common';
import { Database } from '@/database/database';

export type BankAccountRow = {
  userRun: number;
  rutOwner: string;
  bankCode: string;
  bankName: string;
  accountType: string;
  accountNumber: string;
  email: string | null;
};

@Injectable()
export class MySqlClientBankAccountRepository {
  constructor(private db: Database) {}

  async findByUserRun(userRun: number): Promise<BankAccountRow | null> {
    const row = await this.db
      .selectFrom('client_bank_account')
      .select([
        'user_run as userRun',
        'rut_owner as rutOwner',
        'bank_code as bankCode',
        'bank_name as bankName',
        'account_type as accountType',
        'account_number as accountNumber',
        'email',
      ])
      .where('user_run', '=', userRun)
      .executeTakeFirst();

    return (row as any) ?? null;
  }

  async upsert(userRun: number, data: Omit<BankAccountRow, 'userRun'>): Promise<void> {
    const now = new Date();

    // UPSERT real MySQL: INSERT ... ON DUPLICATE KEY UPDATE ...
    await this.db
      .insertInto('client_bank_account')
      .values({
        user_run: userRun,
        rut_owner: data.rutOwner,
        bank_code: data.bankCode,
        bank_name: data.bankName,
        account_type: data.accountType,
        account_number: data.accountNumber,
        email: data.email,
        created_at: now,
        updated_at: now,
      } as any)
      .onDuplicateKeyUpdate({
        rut_owner: data.rutOwner,
        bank_code: data.bankCode,
        bank_name: data.bankName,
        account_type: data.accountType,
        account_number: data.accountNumber,
        email: data.email,
        updated_at: now,
      } as any)
      .execute();
  }
}