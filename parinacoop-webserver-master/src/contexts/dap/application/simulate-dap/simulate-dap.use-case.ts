import { Injectable } from '@/contexts/shared/dependency-injection/injectable';
import { SimulateDapDto } from './simulate-dap.dto';
import { PrimitiveSDap, SDap } from '../../domain/models/SDap';
import { ParameterRepository } from '../../domain/ports/parameter.repository';

@Injectable()
export class SimulateDapUseCase {
  constructor(private parameterRepository: ParameterRepository) {}

  async run(dto: SimulateDapDto): Promise<{ sDaps: PrimitiveSDap[] }> {
    const terms = [30, 60, 90, 120, 180, 366];
    const now = Date.now();

    const parameters = await this.parameterRepository.getAll();

    const sDaps: SDap[] = terms.map((term) => {
      const parameter = parameters.find(
        (p) => p.minimumDays <= term && p.maximumDays >= term,
      );
      if (!parameter) throw new Error('Parameter not found');
      return SDap.create({
        days: term,
        initialDate: now,
        initialAmount: dto.initialAmount,
        interestRateBase: parameter.interestRateBase,
        type: dto.type,
        currencyType: 'CLP',
      });
    });

    return { sDaps: sDaps.map((sDap) => sDap.toValue()) };
  }
}
