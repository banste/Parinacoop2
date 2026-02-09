import { IsString, IsOptional, IsNotEmpty, IsEmail, MinLength } from 'class-validator';

export class UpdateDapInstructionsHttpDto {
  @IsString()
  @IsNotEmpty()
  bankName!: string;

  @IsString()
  @IsNotEmpty()
  accountType!: string;

  @IsString()
  @IsNotEmpty()
  accountNumber!: string;

  @IsString()
  @IsNotEmpty()
  accountHolderName!: string;

  @IsString()
  @IsNotEmpty()
  accountHolderRut!: string;

  @IsOptional()
  @IsString()
  @IsEmail()
  email?: string | null;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  description!: string;
}

export type DapInstructionsHttpDto = {
  bankName: string;
  accountType: string;
  accountNumber: string;
  accountHolderName: string;
  accountHolderRut: string;
  email?: string | null;
  description: string;
};