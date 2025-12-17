import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class CreateDapHttpDto {
  @IsNotEmpty()
  userRun!: number;

  @IsNotEmpty()
  type!: string;

  @IsNotEmpty()
  currencyType!: string;

  @Min(30)
  days!: number;

  @Min(50000)
  @IsInt()
  initialAmount!: number;
}
