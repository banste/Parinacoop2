import { IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordHttpDto {
  @IsString()
  @IsNotEmpty()
  run!: string; // aceptamos string (ej: "20218321" o "8.271.125-2")
}