import { User } from '../entities/user.entity';

export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface UserRepository {
  findAll(q?: string): Promise<User[]>;
  findOne(id: number): Promise<User | null>;
  update(id: number, data: Partial<User>): Promise<User>;
  remove(id: number): Promise<void>;
}