import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsPhoneNumber,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateProfileHttpDto {
  @Min(100000000)
  @IsInt()
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

  @IsPhoneNumber('CL')
  cellphone!: string;

  @IsString()
  @MaxLength(50)
  @IsNotEmpty()
  street!: string;

  @IsPositive()
  @IsInt()
  number!: number;

  @IsString()
  @MaxLength(50)
  @IsNotEmpty()
  detail!: string;

  @IsPositive()
  @IsInt()
  communeId!: number;
  regionId!: number;
}
