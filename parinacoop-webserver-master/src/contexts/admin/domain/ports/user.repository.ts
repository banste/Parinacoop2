import { Role } from '@/contexts/shared/enums/roles.enum';
import { User } from '../models/User';

export abstract class UserRepository {
  abstract getByRun(run: number): Promise<User | null>;
  abstract create(user: User): Promise<User>;
  abstract getByRole(role: Role): Promise<User[]>;
}
