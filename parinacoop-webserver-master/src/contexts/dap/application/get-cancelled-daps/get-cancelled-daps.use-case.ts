import { Injectable } from '@nestjs/common';
import { DapRepository } from '@/contexts/dap/domain/ports/dap.repository';

@Injectable()
export class GetCancelledDapsUseCase {
  constructor(private readonly dapRepository: DapRepository) {}

  async execute({ run }: { run: number }): Promise<{ daps: any[] }> {
    // Llamamos al método concreto del repo; casteamos a any para evitar tocar la interfaz.
    const daps = await (this.dapRepository as any).getCancelledDapsByUserRun(run);
    const primitives = (daps ?? []).map((dap: any) =>
      typeof dap?.toValue === 'function' ? dap.toValue() : dap,
    );
    return { daps: primitives };
  }
}