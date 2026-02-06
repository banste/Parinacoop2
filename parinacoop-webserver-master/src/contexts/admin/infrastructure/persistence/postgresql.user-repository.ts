import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from '../../domain/ports/user.repository';
import { Database } from '@/database/database';
import { User } from '../../domain/models/User';
import { Role } from '@/contexts/shared/enums/roles.enum';
import { sql } from 'kysely';
import { Profile } from '../../domain/models/Profile';

@Injectable()
export class PostgreSqlUserRepository implements UserRepository {
  private readonly logger = new Logger(PostgreSqlUserRepository.name);

  constructor(private db: Database) {}

  async getByRun(run: number): Promise<User | null> {
    const result = await this.db
      .selectFrom('user')
      .selectAll()
      .where('user.run', '=', run as any)
      .executeTakeFirst();

    return result ? new User(result as any) : null;
  }

  /**
   * Devuelve usuarios con el role solicitado.
   * Ahora hace LEFT JOIN con client_profile para obtener email y otros campos de perfil,
   * y construye un objeto User con profile cuando es posible.
   */
  async getByRole(role: Role): Promise<User[]> {
    // Seleccionamos columnas relevantes de user + campos de client_profile
    const rows = await this.db
      .selectFrom('user')
      .leftJoin('client_profile', 'user.run', 'client_profile.user_run')
      .select([
        'user.run as run',
        'user.role as role',
        'user.password as password',
        'client_profile.email as email',
        'client_profile.names as names',
        'client_profile.first_last_name as firstLastName',
        'client_profile.second_last_name as secondLastName',
        'client_profile.cellphone as cellphone',
        'client_profile.document_number as documentNumber',
      ])
      .where('user.role', '=', role as any)
      .execute();

    // Mapear filas a domain User, incluyendo Profile cuando exista
    return rows.map((r: any) => {
      const primitive: any = {
        run: Number(r.run),
        role: role,
      };

      // Si hay datos de perfil (ej. email o names), construimos profile
      const hasProfileData =
        (r.email && String(r.email).trim() !== '') ||
        (r.names && String(r.names).trim() !== '') ||
        (r.firstLastName && String(r.firstLastName).trim() !== '') ||
        (r.secondLastName && String(r.secondLastName).trim() !== '');

      if (hasProfileData) {
        // Profile.create espera un objeto con las propiedades requeridas en Profile.ts
        // Profile.create signature uses Omit<PrimitiveProfile,'id'>, but here we can set id:-1 to satisfy type.
        const profileObj: any = {
          id: -1,
          documentNumber: r.documentNumber ?? null,
          email: r.email ?? '',
          cellphone: r.cellphone ?? '',
          names: r.names ?? '',
          firstLastName: r.firstLastName ?? '',
          secondLastName: r.secondLastName ?? '',
        };

        try {
          primitive.profile = Profile.create({
            documentNumber: profileObj.documentNumber ?? 0,
            email: profileObj.email,
            cellphone: profileObj.cellphone,
            names: profileObj.names,
            firstLastName: profileObj.firstLastName,
            secondLastName: profileObj.secondLastName,
          });
        } catch (e) {
          // Si hay algún problema creando Profile, lo dejamos como objeto plano para evitar romper la lista.
          this.logger.warn('No se pudo crear Profile con los datos DB, usando objeto plano', e as any);
          primitive.profile = {
            id: -1,
            documentNumber: profileObj.documentNumber,
            email: profileObj.email,
            cellphone: profileObj.cellphone,
            names: profileObj.names,
            firstLastName: profileObj.firstLastName,
            secondLastName: profileObj.secondLastName,
          };
        }
      }

      return new User(primitive as any);
    });
  }

  async create(user: User): Promise<User> {
    const { run, role, password, address, profile } = user.toValue();

    // Insert user row
    await this.db
      .insertInto('user')
      .values({
        run,
        role,
        password: password ?? null,
      })
      .executeTakeFirstOrThrow();

    const userClient = new User({ run, role });

    // Insert client_profile if profile provided
    if (profile) {
      await this.db
        .insertInto('client_profile')
        .values({
          user_run: run,
          names: profile.names,
          first_last_name: profile.firstLastName,
          second_last_name: profile.secondLastName,
          email: profile.email,
          cellphone: profile.cellphone,
          document_number: String(profile.documentNumber ?? ''),
          created_at: sql`now()`,
          updated_at: sql`now()`,
        })
        .executeTakeFirstOrThrow();
    }

    // Insert address if provided
    if (address) {
      await this.db
        .insertInto('address')
        .values({
          user_run: run,
          type_address: address.typeAddress,
          street: address.street,
          number: address.number,
          detail: address.detail,
          commune_id: address.communeId,
          created_at: sql`now()`,
          updated_at: sql`now()`,
        })
        .executeTakeFirstOrThrow();
    }

    return userClient;
  }
}