import { Injectable, Inject, Logger } from '@nestjs/common';
import { Kysely } from 'kysely';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user-repository.interface';
import { Database } from '../../../../database/database';

/**
 * Repo Kysely que detecta las tablas reales y realiza join entre
 * la tabla de credenciales (users) y client_profile (datos personales).
 *
 * Se usan algunos // @ts-ignore para evitar errores de tipos de Kysely
 * cuando las columnas/tablas se construyen dinámicamente en runtime.
 */
@Injectable()
export class KyselyUserRepository implements UserRepository {
  private readonly logger = new Logger(KyselyUserRepository.name);
  private _dbInstance?: Kysely<any>;
  private userTable?: string;
  private profileTable?: string;
  private userPk?: string;
  private profileFk?: string;
  private initPromise: Promise<void>;

  constructor(@Inject(Database) private readonly database: Database) {
    this.initPromise = this.detectTables();
  }

  private get db(): Kysely<any> {
    if (this._dbInstance) return this._dbInstance;
    const maybe: any = this.database as any;

    if (maybe.kysely) {
      this._dbInstance = maybe.kysely as Kysely<any>;
      return this._dbInstance;
    }
    if (maybe.db) {
      this._dbInstance = maybe.db as Kysely<any>;
      return this._dbInstance;
    }
    if (typeof maybe.get === 'function') {
      const ret = maybe.get();
      if (ret) {
        this._dbInstance = ret as Kysely<any>;
        return this._dbInstance;
      }
    }

    this._dbInstance = maybe as Kysely<any>;
    if (this._dbInstance) return this._dbInstance;

    throw new Error(
      'No se pudo obtener la instancia de Kysely desde el provider Database. Revisa DatabaseModule/database wrapper.',
    );
  }

  private async detectTables(): Promise<void> {
    const envUser = process.env.USERS_TABLE;
    const envProfile = process.env.CLIENT_PROFILE_TABLE;

    const userCandidates = [envUser, 'users', 'user'].filter(Boolean) as string[];
    const profileCandidates = [envProfile, 'client_profile', 'client_profiles', 'clientprofile'].filter(Boolean) as string[];

    const userPkCandidates = ['run', 'id', 'user_run'];
    const profileFkCandidates = ['user_run', 'run', 'user_id'];

    this.logger.log(`Detectando tablas: usuarios ${JSON.stringify(userCandidates)}, perfil ${JSON.stringify(profileCandidates)}`);

    for (const u of userCandidates) {
      for (const pk of userPkCandidates) {
        try {
          await this.db.selectFrom(u as any).select([pk]).limit(1).executeTakeFirst();
          for (const p of profileCandidates) {
            for (const fk of profileFkCandidates) {
              try {
                await this.db.selectFrom(p as any).select([fk]).limit(1).executeTakeFirst();

                try {
                  await this.db
                    .selectFrom(p as any)
                    .leftJoin(u as any, `${p}.${fk}`, `${u}.${pk}`)
                    .select([`${p}.id`])
                    .limit(1)
                    .executeTakeFirst();

                  this.userTable = u;
                  this.profileTable = p;
                  this.userPk = pk;
                  this.profileFk = fk;
                  this.logger.log(
                    `Detectadas tablas: users="${u}" (pk="${pk}"), profile="${p}" (fk="${fk}")`,
                  );
                  return;
                } catch (joinErr) {
                  this.logger.debug(`Join ${u}.${pk} <-> ${p}.${fk} falló: ${(joinErr as Error).message}`);
                }
              } catch (profileColErr) {
                this.logger.debug(`Tabla perfil "${p}" no válida (falta columna ${fk}): ${(profileColErr as Error).message}`);
              }
            }
          }
        } catch (userColErr) {
          this.logger.debug(`Tabla usuario "${u}" no válida para pk ${pk}: ${(userColErr as Error).message}`);
        }
      }
    }

    const triedUser = userCandidates.join(', ');
    const triedProfile = profileCandidates.join(', ');
    const msg = `No se encontró la pareja de tablas users/profile válidas. Usuarios probados: ${triedUser}. Perfiles probados: ${triedProfile}. Si tus tablas tienen otro nombre, define USERS_TABLE y CLIENT_PROFILE_TABLE env vars.`;
    this.logger.error(msg);
    throw new Error(msg);
  }

  private mapRow(row: any): User {
    return {
      id: row.id ?? null,
      name: `${row.names ?? ''} ${row.first_last_name ?? ''}`.trim() || null,
      run: row.user_run ?? row.run ?? null,
      email: row.email ?? null,
      role: row.role ?? null,
      active: row.active ?? true,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    };
  }

  private async ensureInit(): Promise<void> {
    return this.initPromise;
  }

  async findAll(q?: string): Promise<User[]> {
    await this.ensureInit();
    const userT = this.userTable as string;
    const profileT = this.profileTable as string;
    const userPk = this.userPk as string;
    const profileFk = this.profileFk as string;

    const selectCols = [
      `${profileT}.id`,
      `${profileT}.user_run`,
      `${profileT}.document_number`,
      `${profileT}.names`,
      `${profileT}.first_last_name`,
      `${profileT}.email`,
      `${profileT}.created_at`,
      `${profileT}.updated_at`,
      `${userT}.role`,
      `${userT}.${userPk} as user_run_from_users`,
    ];

    const qb = this.db
      .selectFrom(profileT as any)
      .leftJoin(userT as any, `${profileT}.${profileFk}`, `${userT}.${userPk}`);

    // @ts-ignore: select dinámico con columnas construidas en runtime
    qb.select(selectCols as unknown as any);

    if (q) {
      const like = `%${q.toLowerCase()}%`;
      // @ts-ignore: expression builder dinámico
      qb.where((eb: any) =>
        eb.or([
          eb(`${profileT}.names`, 'like', like),
          eb(`${profileT}.email`, 'like', like),
          eb(`${userT}.${userPk}`, 'like', like),
        ]),
      );
    }

    const rows = await qb.execute();
    return rows.map(this.mapRow);
  }

  async findOne(id: number): Promise<User | null> {
    await this.ensureInit();
    const userT = this.userTable as string;
    const profileT = this.profileTable as string;
    const userPk = this.userPk as string;
    const profileFk = this.profileFk as string;

    const selectCols = [
      `${profileT}.id`,
      `${profileT}.user_run`,
      `${profileT}.document_number`,
      `${profileT}.names`,
      `${profileT}.first_last_name`,
      `${profileT}.email`,
      `${profileT}.created_at`,
      `${profileT}.updated_at`,
      `${userT}.role`,
      `${userT}.${userPk} as user_run_from_users`,
    ];

    const qb = this.db
      .selectFrom(profileT as any)
      .leftJoin(userT as any, `${profileT}.${profileFk}`, `${userT}.${userPk}`);

    // @ts-ignore: select dinámico con columnas construidas en runtime
    qb.select(selectCols as unknown as any);

    // @ts-ignore: where dinámico
    const row = await qb.where(`${profileT}.id`, '=', id).executeTakeFirst();
    return row ? this.mapRow(row) : null;
  }

  async update(id: number, data: Partial<User>): Promise<User> {
    await this.ensureInit();
    const userT = this.userTable as string;
    const profileT = this.profileTable as string;
    const userPk = this.userPk as string;
    const profileFk = this.profileFk as string;

    const profileSet: Record<string, any> = {};
    const userSet: Record<string, any> = {};

    if (data.name !== undefined) {
      const parts = String(data.name).split(' ');
      profileSet['names'] = parts[0] ?? null;
      profileSet['first_last_name'] = parts.slice(1).join(' ') || null;
    }
    if (data.email !== undefined) profileSet['email'] = data.email;
    if (data.run !== undefined) {
      userSet[userPk] = data.run;
      profileSet['user_run'] = data.run;
    }
    if (data.role !== undefined) userSet['role'] = data.role;

    if (Object.keys(profileSet).length > 0) {
      // @ts-ignore: raw now()
      await this.db.updateTable(profileT as any).set({ ...profileSet, updated_at: this.db.raw('now()') as any }).where(`${profileT}.id`, '=', id).execute();
    }

    if (Object.keys(userSet).length > 0) {
      const profile = await this.db.selectFrom(profileT as any).select(['user_run']).where(`${profileT}.id`, '=', id).executeTakeFirst();
      const userRunVal = profile?.user_run;
      if (userRunVal == null) throw new Error('User run not found on profile');
      // @ts-ignore: raw now()
      await this.db.updateTable(userT as any).set({ ...userSet, updated_at: this.db.raw('now()') as any }).where(`${userT}.${userPk}`, '=', userRunVal).execute();
    }

    const updated = await this.findOne(id);
    if (!updated) throw new Error('User not found after update');
    return updated;
  }

  async remove(id: number): Promise<void> {
    await this.ensureInit();
    const profileT = this.profileTable as string;
    await this.db.deleteFrom(profileT as any).where('id', '=', id).execute();
  }
}