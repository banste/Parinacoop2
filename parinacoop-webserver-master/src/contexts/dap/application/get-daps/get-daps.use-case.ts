import { Injectable } from '@nestjs/common';
import { DapRepository } from '@/contexts/dap/domain/ports/dap.repository';

@Injectable()
export class GetDapsUseCase {
  constructor(private readonly dapRepository: DapRepository) {}

  async execute({ run }: { run: number }): Promise<{ daps: any[] }> {
    const daps = await this.dapRepository.getDapsByUserRun(run);

    // ✅ Si viene entidad con toValue(), la convertimos.
    // ✅ Si viene objeto plano (row/primitivo), lo devolvemos tal cual.
    const primitives = (daps ?? []).map((dap: any) =>
      typeof dap?.toValue === 'function' ? dap.toValue() : dap,
    );

    return { daps: primitives };
  }
}
