import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { GetCuentasAhorroUseCase } from '@/contexts/cuenta-ahorro/application/get-cuentas-ahorro-use-case/get-cuentas-ahorro.use-case';
import { CuentaAhorro} from '@/contexts/cuenta-ahorro/domain/models/cuentaAhorro';

@Controller('clients')
export class GetCuentasAhorroController {
  constructor(private getCuentasAhorroUseCase: GetCuentasAhorroUseCase) {}

  @Get(':run/cuentas-ahorro')
  async run(@Param('run', ParseIntPipe) run: number) {
    const cuentas = await this.getCuentasAhorroUseCase.execute({ run });
    return { cuentas: cuentas.map((x: CuentaAhorro) => x.toValue()) };
  }
}