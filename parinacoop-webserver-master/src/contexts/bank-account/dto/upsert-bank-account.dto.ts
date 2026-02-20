import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertBankAccountDto {
  @IsString()
  @MaxLength(20)
  rutOwner!: string;

  @IsString()
  @MaxLength(20)
  bankCode!: string;

  @IsString()
  @MaxLength(100)
  bankName!: string;

  @IsString()
  @MaxLength(30)
  accountType!: string;

  @IsString()
  @MaxLength(30)
  accountNumber!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  email?: string;
}