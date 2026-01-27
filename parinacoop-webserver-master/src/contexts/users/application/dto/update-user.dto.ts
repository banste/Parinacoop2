import { IsOptional, IsString, IsEmail, IsBoolean } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  // Aceptamos run como string (p. ej. "20218321"). Si frontend envía número,
  // class-transformer puede convertirlo; en la práctica conviene enviar string.
  @IsOptional()
  @IsString()
  run?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}