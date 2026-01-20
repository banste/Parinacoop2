export interface PrimitiveAuthUser {
  run: number;
  role: string;
  password?: string;
  // optional profile block
  profile?: {
    names?: string;
    firstLastName?: string;
    secondLastName?: string;
    email?: string;
    cellphone?: string;
    documentNumber?: string | number;
  };
  // optional address block
  address?: {
    typeAddress?: string;
    street?: string;
    number?: number;
    detail?: string;
    communeId?: number;
  };
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

  get password(): string | undefined {
    return this.props.password;
  }
}