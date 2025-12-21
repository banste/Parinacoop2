import { CuentaAhorroRepository } from '../../domain/ports/cuenta-ahorro.repository';

export class GetCuentasAhorroUseCase {
  constructor(private cuentaAhorroRepository: CuentaAhorroRepository) {}

  async execute({ run }: { run: number }) {
    return this.cuentaAhorroRepository.findByUserRun(run);
  }
}