import { Kysely } from 'kysely';
import { UserTable } from './tables/UsuarioTable';
import { RegionTable } from './tables/regionTable';
import { CommuneTable } from './tables/communeTable';
import { ClientProfileTable } from './tables/clientprofileTable';
import { AddressTable } from './tables/addressTable';
import { UserSessionTable } from './tables/usersessionTable';
import { PasswordresetTable } from './tables/passwordresetTable';
import { DapTable } from './tables/dapTable';
import { ParameterTable } from './tables/parameterTable';
import { DapContractsTable } from './tables/dapcontractsTable';
import { DapAttachmentsTable } from './tables/dapattachmentsTable';

export interface Tables {
  user: UserTable;
  region: RegionTable;
  commune: CommuneTable;
  client_profile: ClientProfileTable;
  address: AddressTable;
  user_session: UserSessionTable;
  passwordreset: PasswordresetTable;
  dap: DapTable;
  parameter: ParameterTable;
  dap_contracts: DapContractsTable;
  dap_attachments: DapAttachmentsTable

}

export class Database extends Kysely<Tables> {}