import { IsString, IsIn } from 'class-validator';

export class UpdateDapStatusDto {
  @IsString()
  @IsIn(['PENDING', 'ACTIVE', 'CANCELLED', 'ANNULLED', 'PAID', 'EXPIRED', 'EXPIRED-PENDING'])
  status!: string; // "!" indica: confío en que se asignará (evita el error TS2564)
}