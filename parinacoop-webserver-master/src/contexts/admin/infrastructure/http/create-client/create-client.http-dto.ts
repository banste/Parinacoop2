import { IsValidRun } from '@/utils/validators/rut.validator';
import {
  IsString,
  MinLength,
  IsPositive,
  IsInt,
  IsEmail,
  Min,
  IsNotEmpty,
  IsPhoneNumber,
  MaxLength,
} from 'class-validator';

export class CreateClientHttpDto {
  @IsValidRun()
  @IsString()
  run!: string;

  @MinLength(8)
  @MaxLength(20)
  @IsString()
  password!: string;

  @Min(100000000)
  @IsInt()
  documentNumber!: number;

  @IsEmail()
  @IsString()
  @MaxLength(50)
  email!: string;

  @IsPhoneNumber('CL')
  cellphone!: string;

  @IsString()
  @MaxLength(50)
  @IsNotEmpty()
  names!: string;

  @IsString()
  @MaxLength(20)
  @IsNotEmpty()
  firstLastName!: string;

  @IsString()
  @MaxLength(20)
  @IsNotEmpty()
  secondLastName!: string;

  @IsString()
  @MaxLength(20)
  @IsNotEmpty()
  typeAddress!: string;

  @IsString()
  @MaxLength(50)
  @IsNotEmpty()
  street!: string;

  @IsPositive()
  @IsInt()
  number!: number;

  @IsString()
  @MaxLength(50)
  @IsNotEmpty()
  detail!: string;

  @IsPositive()
  @IsInt()
  communeId!: number;
}
