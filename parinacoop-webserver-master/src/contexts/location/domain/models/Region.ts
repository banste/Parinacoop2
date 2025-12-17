export interface PrimitiveRegion {
  id: number;
  name: string;
  romanNumber: string;
  number: number;
  abbreviation: string;
}

export class Region {
  constructor(private attributes: PrimitiveRegion) {}

  toValue(): PrimitiveRegion {
    return this.attributes;
  }
}
