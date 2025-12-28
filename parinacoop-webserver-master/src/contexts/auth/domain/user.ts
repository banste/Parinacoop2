export interface PrimitiveAuthUser {
  run: number;
  role: string;
  password?: string;
  // agrega campos que necesites
}

export class User {
  constructor(private props: PrimitiveAuthUser) {}

  toValue(): PrimitiveAuthUser {
    return this.props;
  }

  get run(): number {
    return this.props.run;
  }
  get role(): string {
    return this.props.role;
  }
}