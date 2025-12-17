export interface PrimitiveAddress {
  id: number;
  typeAddress: string;
  street: string;
  number: number;
  detail: string;
  communeId: number;
}

export class Address {
  constructor(private attributes: PrimitiveAddress) {}

  static create(data: Omit<PrimitiveAddress, 'id'>): Address {
    return new Address({
      ...data,
      id: -1,
    });
  }

  toValue(): PrimitiveAddress {
    return this.attributes;
  }
}
