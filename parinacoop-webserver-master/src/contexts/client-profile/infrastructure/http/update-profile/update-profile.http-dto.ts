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
} from 'class-validator';

/**
 * DTO que recibe la petición PATCH desde el frontend.
 * - documentNumber se acepta como string (ej. "12.345.678") para no fallar la validación cuando el frontend envía puntos.
 * - regionId / communeId son opcionales (si UI no las selecciona no se devolverá 400).
 */
export class UpdateProfileHttpDto {
  @IsString()
  @Matches(/^[0-9.\-]+$/, { message: 'documentNumber must contain only digits, dots or hyphens' })
  @IsNotEmpty()
  documentNumber!: string;

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
  @Min(1)
  number!: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  detail?: string;

  // Opcional: si no se envían, no fallará la validación en el controller
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  communeId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  regionId?: number;
}