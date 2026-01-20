import { User } from './user';

/**
 * Contrato (puerto) para operaciones sobre usuarios en el contexto auth.
 * Se añade create(...) para permitir la creación de usuarios desde RegisterUseCase.
 */
export abstract class UserRepository {
  abstract getByRun(run: number): Promise<User | null>;
  // Método añadido: la implementación debe crear el usuario en BD
  abstract create(user: User): Promise<User>;
}