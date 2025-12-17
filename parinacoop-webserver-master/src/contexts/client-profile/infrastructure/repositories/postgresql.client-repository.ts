import { Injectable } from '@nestjs/common';
import { ClientRepository } from '../../domain/ports/client.repository';
import { Database } from '@/database/database';
import { Client } from '../../domain/models/Client';

@Injectable()
export class PostgreSqlClientRepository implements ClientRepository {
  constructor(private db: Database) {}

  async getProfileByRun(run: number): Promise<Client | null> {
    const result = await this.db
      .selectFrom('client_profile')
      .innerJoin('address', 'address.user_run', 'client_profile.user_run')
      .innerJoin('commune', 'commune.id', 'address.commune_id')
      .where('client_profile.user_run', '=', run)
      .select([
        'client_profile.user_run as run',
        'document_number as documentNumber',
        'names',
        'first_last_name as firstLastName',
        'second_last_name as secondLastName',
        'email',
        'cellphone',
        'street',
        'address.number as number',
        'detail',
        'region_id as regionId',
        'commune_id as communeId',
      ])
      .executeTakeFirst();
    return result ? new Client(result) : null;
  }
  async updateProfile(client: Client): Promise<void> {
    const data = client.toValue();
    const clientProfileResult = await this.db
      .updateTable('client_profile')
      .set({
        names: data.names,
        first_last_name: data.firstLastName,
        second_last_name: data.secondLastName,
        email: data.email,
        cellphone: data.cellphone,
        updated_at: new Date(Date.now()),
      })
      .where('user_run', '=', data.run)
      .executeTakeFirst();

    const addressResult = await this.db
      .updateTable('address')
      .set({
        street: data.street,
        number: data.number,
        detail: data.detail,
        commune_id: data.communeId,
      })
      .where('user_run', '=', data.run)
      .executeTakeFirst();

    console.log(`Perfiles afectados: ${clientProfileResult.numUpdatedRows}`);
    console.log(`Direcciones afectadas: ${addressResult.numUpdatedRows}`);
  }
}
