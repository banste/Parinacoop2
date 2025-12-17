import { Role } from '@/contexts/shared/enums/roles.enum';

export interface UserRequest {
  run: number;
  role: Role;
}
