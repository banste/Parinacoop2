  import { Injectable } from '@nestjs/common';
  import { ClientRepository } from '../../domain/ports/client.repository';
  import { Database } from '@/database/database';
  import { Client } from '../../domain/models/Client';


  @Injectable()
  export class PostgreSqlClientRepository implements ClientRepository {
    constructor(private db: Database) {}

    async getProfileByRun(run: number): Promise<Client | null> {
      const row = (await this.db
        .selectFrom('client_profile')
        .innerJoin('address', 'address.user_run', 'client_profile.user_run')
        .innerJoin('commune', 'commune.id', 'address.commune_id')
        .where('client_profile.user_run', '=', run)
        // seleccionamos todo y mapeamos luego para evitar overload/typing issues de Kysely
        .selectAll()
        .executeTakeFirst()) as any | undefined;

      if (!row) return null;

      // Normalizamos nombres de campos que vienen en snake_case desde la BD
      const profile = {
        run: row.user_run ?? row.run,
        documentNumber: row.document_number ?? row.documentNumber,
        names: row.names,
        firstLastName: row.first_last_name ?? row.firstLastName,
        secondLastName: row.second_last_name ?? row.secondLastName,
        email: row.email,
        cellphone: row.cellphone,
        street: row.street,
        number: (row.number ?? row['address.number'] ?? 0) as number,
        detail: row.detail,
        regionId: row.region_id ?? row['address.region_id'] ?? 0,
        communeId: row.commune_id ?? row['address.commune_id'] ?? row.commune_id ?? 0,
      };

      return new Client(profile as any);
    }

    /**
     * Actualiza profile + address. Si la fila de address no existe, la inserta.
     */
    async updateProfile(client: Client): Promise<void> {
      const data = client.toValue();

      try {
        // Actualizar client_profile
        const clientProfileResult = await this.db
          .updateTable('client_profile')
          .set({
            names: data.names,
            first_last_name: data.firstLastName,
            second_last_name: data.secondLastName,
            email: data.email,
            cellphone: data.cellphone,
            updated_at: new Date(),
          })
          .where('user_run', '=', data.run)
          .execute();

        // Actualizar address
        const addressUpdate = await this.db
          .updateTable('address')
          .set({
            street: data.street,
            number: data.number,
            detail: data.detail,
            commune_id: data.communeId,
          })
          .where('user_run', '=', data.run)
          .execute();

        // Determinar número de filas actualizadas de forma robusta
        const clientProfileUpdated =
          (clientProfileResult as any)?.numUpdatedRows ??
          (clientProfileResult as any)?.rowCount ??
          0;
        const addressUpdated =
          (addressUpdate as any)?.numUpdatedRows ?? (addressUpdate as any)?.rowCount ?? 0;

        // Si no existe fila de address para este user_run, insertamos una nueva
        if (addressUpdated === 0) {
          try {
            const insertRes = await this.db
              .insertInto('address')
              .values({
                user_run: data.run,
                type_address: 'particular', // ajusta si tu schema requiere otro valor
                street: data.street,
                number: data.number,
                detail: data.detail,
                commune_id: data.communeId,
                created_at: new Date(),
                updated_at: new Date(),
              })
              .execute();

            const inserted =
              (insertRes as any)?.numInsertedRows ?? (insertRes as any)?.rowCount ?? 0;
            console.log(`updateProfile: address inserted rows = ${inserted}`);
          } catch (insertErr) {
            console.error('[PostgreSqlClientRepository] failed to insert address:', insertErr);
            throw insertErr;
          }
        }

        console.log(`updateProfile: client_profile updated rows = ${clientProfileUpdated}`);
        console.log(`updateProfile: address updated rows = ${addressUpdated}`);
      } catch (err) {
        console.error('[PostgreSqlClientRepository] updateProfile error:', err);
        throw err;
      }
    }
  }