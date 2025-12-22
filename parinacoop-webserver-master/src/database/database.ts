import { Kysely } from 'kysely';

import { RegionTable } from './tables/regionTable';
import { CommuneTable } from './tables/communeTable';
import { ClientProfileTable } from './tables/clientprofileTable';
import { AddressTable } from './tables/addressTable';
import { UserSessionTable } from './tables/usersessionTable';
import { PasswordResetTable } from './tables/passwordresetTable';
import { DapTable } from './tables/dapTable';
import { ParameterTable } from './tables/parameterTable';
import { UsuarioTable } from './tables/usuarioTable';

// ✅ NUEVO
import { DapInstructionsTable } from './tables/dapInstructionsTable';

export interface Tables {
  region: RegionTable;
  commune: CommuneTable;
  user: UsuarioTable;
  client_profile: ClientProfileTable;
  address: AddressTable;
  user_session: UserSessionTable;
  password_reset: PasswordResetTable;
  dap: DapTable;
  parameter: ParameterTable;

  // ✅ NUEVO
  dap_instructions: DapInstructionsTable;

  // tu nueva tabla real de usuarios (si la tienes)
  usuario: UsuarioTable;
}

export class Database extends Kysely<Tables> {}
