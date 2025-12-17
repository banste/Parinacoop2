export interface PrimitiveCommune {
  id: number;
  name: string;
  postalCode: number;
  regionId: number;
}

export class Commune {
  constructor(private attributes: PrimitiveCommune) {}

  toValue(): PrimitiveCommune {
    return this.attributes;
  }
}
