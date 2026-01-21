import { Generated } from 'kysely';

export interface PasswordresetTable {
  id_passwordreset: Generated<number>;
  run: number;
  token?: string | null;
  token_hash?: string | null;
  expiration?: Date | null;       // timestamp
  fecha_creacion?: Date | null;   // timestamp
  used_at?: Date | null;          // timestamp
}