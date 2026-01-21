import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordHttpDto {
  @IsString()
  @IsNotEmpty()
  run!: string; // aceptamos formato RUT; el controller normaliza a dígitos

  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword!: string;
}