export class UserClientExistsException extends Error {
  constructor() {
    super('El cliente ya existe');
  }
}
