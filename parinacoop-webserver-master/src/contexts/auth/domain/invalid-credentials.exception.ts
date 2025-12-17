export class InvalidCredentialsException extends Error {
  constructor() {
    super('Las credenciales no son correctas.');
  }
}
