import { Injectable } from '@/contexts/shared/dependency-injection/injectable';
import { DapRepository } from '../../domain/ports/dap.repository';
import { PrimitiveDap } from '../../domain/models/Dap';
import { GetDapsDto } from './get-daps.dto';

@Injectable()
export class GetDapsUseCase {
  constructor(private dapRepository: DapRepository) {}

  async execute(dto: GetDapsDto): Promise<{ daps: PrimitiveDap[] }> {
    const daps = await this.dapRepository.getDapsByUserRun(dto.run);
    return { daps: daps.map((dap) => dap.toValue()) };
  }
}
