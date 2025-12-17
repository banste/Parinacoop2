export interface PrimitiveClient {
  run: number;
  documentNumber: number;
  names: string;
  firstLastName: string;
  secondLastName: string;
  email: string;
  cellphone: string;
  street: string;
  number: number;
  detail: string;
  regionId: number;
  communeId: number;
}

export class Client {
  constructor(private attributes: PrimitiveClient) {}

  toValue(): PrimitiveClient {
    return this.attributes;
  }
}
