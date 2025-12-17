export class UserNotFoundException extends Error {
  constructor(run: number) {
    super(`Usuario con run ${run} no encontrado.`);
  }
}
