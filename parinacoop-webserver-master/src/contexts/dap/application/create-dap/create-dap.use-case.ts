import { Injectable } from '@/contexts/shared/dependency-injection/injectable';
import { DapRepository } from '../../domain/ports/dap.repository';
import { Dap, PrimitiveDap } from '../../domain/models/Dap';
import { CreateDapDto } from './create-dap.dto';
import { SDap } from '../../domain/models/SDap';
import { ParameterRepository } from '../../domain/ports/parameter.repository';

@Injectable()
export class CreateDapUseCase {
  constructor(
    private dapRepository: DapRepository,
    private parameterRepository: ParameterRepository,
  ) {}

  async execute(dto: CreateDapDto): Promise<{ dap: PrimitiveDap }> {
    const parameter = await this.parameterRepository.getByDays(dto.days);

    const simulatedDap = SDap.create({
      days: dto.days,
      initialAmount: dto.initialAmount,
      initialDate: Date.now(),
      interestRateBase: parameter.interestRateBase,
      currencyType: dto.currencyType,
      type: dto.type,
    });
    
    const newDap = await this.dapRepository.create(
      Dap.create(dto.userRun, simulatedDap),
    );

    return { dap: newDap.toValue() };
  }
  
}
