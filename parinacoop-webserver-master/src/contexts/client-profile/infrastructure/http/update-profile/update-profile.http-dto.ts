import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Matches,
  IsPositive,
} from 'class-validator';

export class UpdateProfileHttpDto {
  @Type(() => Number)
  @IsInt()
  @Min(100000000)
  documentNumber!: number;

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

  @IsEmail()
  @IsString()
  @MaxLength(50)
  email!: string;

  // Acepta teléfono local (8-9 dígitos) o con +56 prefijo opcional
  @IsString()
  @Matches(/^(\+56)?\d{8,9}$/, {
    message: 'cellphone must be 8–9 digits, optionally prefixed with +56',
  })
  cellphone!: string;

  @IsString()
  @MaxLength(50)
  @IsNotEmpty()
  street!: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  number!: number;

  // detail ahora opcional en HTTP; el dominio puede recibir '' si lo prefieres
  @IsOptional()
  @IsString()
  @MaxLength(50)
  detail?: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  communeId!: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  regionId!: number;
}