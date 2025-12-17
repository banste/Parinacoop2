import { User } from './user';

export abstract class UserRepository {
  abstract getByRun(run: number): Promise<User | null>;
}
