import { Parameter } from '../models/Parameter';

export abstract class ParameterRepository {
  abstract getAll(): Promise<Parameter[]>;
  abstract getByDays(days: number): Promise<Parameter>;
}
