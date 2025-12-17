import { Generated } from 'kysely';

export interface UserSessionTable {
  id: Generated<number>;
  user_run: number;
  login_at: number;
  logout_at: number;
  ip_address: string;
  user_agent: string;
}
