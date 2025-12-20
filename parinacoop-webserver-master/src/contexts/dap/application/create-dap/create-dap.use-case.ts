import { Injectable } from '@/contexts/shared/dependency-injection/injectable';
import { DapRepository } from '../../domain/ports/dap.repository';
import { ParameterRepository } from '../../domain/ports/parameter.repository';
import { CreateDapDto } from './create-dap.dto';
import { Dap, PrimitiveDap } from '../../domain/models/Dap';
import { SDap } from '../../domain/models/SDap';

@Injectable()
export class CreateDapUseCase {
  constructor(
    private readonly dapRepository: DapRepository,
    private readonly parameterRepository: ParameterRepository,
  ) {}

  async execute(dto: CreateDapDto): Promise<{ dap: PrimitiveDap }> {
    const payload = dto as any;

    // ---------- NORMALIZACIÓN ----------
    const days = Number(payload.days);

    const initialAmountRaw =
      payload.initialAmount ??
      payload.initial_amount ??
      payload.amount;

    const initialAmount = Number(
      typeof initialAmountRaw === 'string'
        ? initialAmountRaw.replace(/[^\d]/g, '')
        : initialAmountRaw,
    );

    const userRun = Number(payload.userRun);

    if (
      Number.isNaN(days) ||
      Number.isNaN(initialAmount) ||
      Number.isNaN(userRun)
    ) {
      throw new Error(
        `DTO inválido: days=${payload.days}, amount=${initialAmountRaw}, userRun=${payload.userRun}`,
      );
    }

    // ---------- PARÁMETRO ----------
    const parameter = await this.parameterRepository.getByDays(days);

    const interestRateBase = Number(
      String(parameter.interestRateBase).replace(',', '.'),
    );

    if (Number.isNaN(interestRateBase)) {
      throw new Error(
        `interestRateBase inválido: ${parameter.interestRateBase}`,
      );
    }

    // ---------- DOMINIO ----------
    const simulatedDap = SDap.create({
      days,
      initialAmount,
      initialDate: new Date().getTime(),
      interestRateBase,
      currencyType: payload.currencyType,
      type: payload.type,
    });

    // ---------- PERSISTENCIA ----------
    const dap = await this.dapRepository.create(
      Dap.create(userRun, simulatedDap),
    );

    return { dap: dap.toValue() };
  }
}

