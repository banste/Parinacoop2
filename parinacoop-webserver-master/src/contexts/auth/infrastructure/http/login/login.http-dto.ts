import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class LoginHttpDto {
  /**
   * RUN del cliente
   * @example 12345678
   */
  @IsInt()
  @IsNotEmpty()
  run!: number;

  /**
   * Contraseña del cliente
   * @example password
   */
  @IsString()
  @IsNotEmpty()
  password!: string;
}
