import { Injectable } from '@nestjs/common';
import { DapRepository } from '@/contexts/dap/domain/ports/dap.repository';

/**
 * Use-case minimal que reutiliza getDapsByUserRun y filtra en memoria
 * por status = 'cancelled' (case-insensitive). Esto evita tocar la
 * interfaz DapRepository o cambiar implementaciones de repositorio.
 */
@Injectable()
export class GetCancelledDapsUseCase {
  constructor(private readonly dapRepository: DapRepository) {}

  async execute({ run }: { run: number }): Promise<{ daps: any[] }> {
    // Obtener todos los daps (el repo ya puede filtrar anuladas si corresponde)
    const daps = await this.dapRepository.getDapsByUserRun(run);

    const primitives = (daps ?? [])
      .map((dap: any) => (typeof dap?.toValue === 'function' ? dap.toValue() : dap))
      .filter((v: any) => {
        const status = String(v?.status ?? v?.estado ?? '').toLowerCase();
        return status === 'cancelled';
      });

    return { daps: primitives };
  }
}