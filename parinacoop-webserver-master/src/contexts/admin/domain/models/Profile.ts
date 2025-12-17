export interface PrimitiveProfile {
  id: number;
  documentNumber: number;
  email: string;
  cellphone: string;
  names: string;
  firstLastName: string;
  secondLastName: string;
}
export class Profile {
  constructor(private attributes: PrimitiveProfile) {}

  static create(data: Omit<PrimitiveProfile, 'id'>): Profile {
    return new Profile({
      ...data,
      id: -1,
    });
  }

  toValue(): PrimitiveProfile {
    return this.attributes;
  }
}
