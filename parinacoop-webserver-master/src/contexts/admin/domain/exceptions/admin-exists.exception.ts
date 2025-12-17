export class AdminExistsException extends Error {
  constructor() {
    super('Ya se ha creado un administrador previamente');
  }
}
