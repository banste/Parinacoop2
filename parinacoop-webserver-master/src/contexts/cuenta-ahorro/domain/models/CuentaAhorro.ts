export interface PrimitiveCuentaAhorro {
  id: number;
  userRun: number;
  saldo: number;
  tipo: string;
  fecha_apertura: Date;
  // ...otros campos
}

export class CuentaAhorro {
  constructor(private attributes: PrimitiveCuentaAhorro) {}
  toValue(): PrimitiveCuentaAhorro {
    return this.attributes;
  }
}