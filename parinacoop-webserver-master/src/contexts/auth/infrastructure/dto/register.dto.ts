import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AddressDto {
  @IsString()
  @IsNotEmpty()
  typeAddress!: string; // 'home' | 'work' etc

  @IsString()
  @IsNotEmpty()
  street!: string;

  @IsInt()
  number!: number;

  @IsString()
  @IsOptional()
  detail?: string;

  // Permitimos communeId también dentro de address (frontend puede enviarlo ahí)
  @IsInt()
  @IsOptional()
  communeId?: number;
}

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  run!: string;

  @IsString()
  @IsNotEmpty()
  documentNumber!: string;

  @IsString()
  @IsNotEmpty()
  names!: string;

  @IsString()
  @IsNotEmpty()
  firstLastName!: string;

  @IsString()
  @IsOptional()
  secondLastName?: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @IsString()
  @IsNotEmpty()
  cellphone!: string;

  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  address?: AddressDto;

  // Añadimos regionId / communeId a top-level para cubrir payloads que los envían ahí
  @IsInt()
  @IsOptional()
  regionId?: number;

  @IsInt()
  @IsOptional()
  communeId?: number;
}