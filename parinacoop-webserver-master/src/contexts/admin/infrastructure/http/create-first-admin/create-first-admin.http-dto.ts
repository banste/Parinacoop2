import { IsValidRun } from '@/utils/validators/rut.validator';
import { IsString, MinLength } from 'class-validator';

export class CreateFirstAdminHttpDto {
  @IsValidRun()
  @IsString()
  run!: string;

  @MinLength(8)
  @IsString()
  password!: string;
}
