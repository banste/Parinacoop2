export interface PrimitiveParameter {
  id: number;
  minimumDays: number;
  maximumDays: number;
  interestRateBase: number;
}
export class Parameter {
  public id: number;
  public minimumDays: number;
  public maximumDays: number;
  public interestRateBase: number;

  constructor(attributes: PrimitiveParameter) {
    this.id = attributes.id;
    this.minimumDays = attributes.minimumDays;
    this.maximumDays = attributes.maximumDays;
    this.interestRateBase = attributes.interestRateBase;
  }
}
