import { User } from './user';

/**
 * Contrato (puerto) para operaciones sobre usuarios en el contexto auth.
 */
export abstract class UserRepository {
  abstract getByRun(run: number): Promise<User | null>;
  abstract create(user: User): Promise<User>;
  // Nuevo método para actualizar password
  abstract updatePassword(run: number, hashedPassword: string): Promise<void>;
}