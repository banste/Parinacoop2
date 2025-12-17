import { Role } from '@/contexts/shared/enums/roles.enum';
import { PrimitiveProfile, Profile } from './Profile';
import { Address, PrimitiveAddress } from './Address';

export interface PrimitiveUser {
  run: number;
  role: Role;
  password?: string;
  profile?: Profile;
  address?: Address;
}

export interface TPrimitiveUser {
  run: number;
  role: Role;
  password?: string;
  profile?: PrimitiveProfile;
  address?: PrimitiveAddress;
}

export class User {
  constructor(private attributes: PrimitiveUser) {}

  set profile(data: PrimitiveProfile) {
    this.attributes.profile = Profile.create(data);
  }

  set address(data: PrimitiveAddress) {
    this.attributes.address = Address.create(data);
  }

  static create(data: PrimitiveUser): User {
    return new User(data);
  }

  toValue(): TPrimitiveUser {
    return {
      run: this.attributes.run,
      role: this.attributes.role,
      password: this.attributes.password,
      profile: this.attributes.profile?.toValue(),
      address: this.attributes.address?.toValue(),
    };
  }
}
