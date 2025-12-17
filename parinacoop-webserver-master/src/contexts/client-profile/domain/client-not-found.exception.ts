export class ClientNotFoundError extends Error {
  constructor(run: number) {
    super(`Cliente con run ${run} no existe`);
  }
}
