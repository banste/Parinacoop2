import { Injectable } from '@nestjs/common';
import { ParameterRepository } from '../../domain/ports/parameter.repository';
import { Parameter } from '../../domain/models/Parameter';
import { Database } from '@/database/database';

@Injectable()
export class MySqlParameterRepository implements ParameterRepository {
  constructor(private db: Database) {}

  async getAll(): Promise<Parameter[]> {
    const result = await this.db
      .selectFrom('parameter')
      .select([
        'id',
        'interest_rate_base as interestRateBase',
        'minimum_days as minimumDays',
        'maximum_days as maximumDays',
      ])
      .execute();

    return result.map((row) => new Parameter(row));
  }
  async getByDays(days: number): Promise<Parameter> {
    const result = await this.db
      .selectFrom('parameter')
      .where('minimum_days', '<=', days)
      .where('maximum_days', '>=', days)
      .select([
        'id',
        'interest_rate_base as interestRateBase',
        'minimum_days as minimumDays',
        'maximum_days as maximumDays',
      ])
      .executeTakeFirstOrThrow();

    return new Parameter(result);
  }
}
