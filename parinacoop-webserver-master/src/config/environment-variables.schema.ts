import { IsEnum, IsNumber, IsString, Max, Min } from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV!: Environment;

  // 👇 CAMBIO AQUÍ: antes era @IsUrl()
  @IsString()
  DB_HOST!: string;

  @IsNumber()
  @Min(0)
  @Max(65535)
  DB_PORT!: number;

  @IsString()
  DB_NAME!: string;

  @IsString()
  DB_USER!: string;

  @IsString()
  DB_PASSWORD!: string;

  @IsNumber()
  @Min(0)
  @Max(65535)
  PORT!: number;

  @IsString()
  JWT_SECRET!: string;

  @IsString()
  JWT_EXPIRES_IN!: string;
}
