import { Generated } from 'kysely';

export interface PasswordResetTable {
  id: Generated<number>;
  user_run: number;
  token: string;
  expires_at: number;
  created_at: number;
}
