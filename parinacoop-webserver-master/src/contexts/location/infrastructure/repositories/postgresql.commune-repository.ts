import { Injectable } from '@/contexts/shared/dependency-injection/injectable';
import { Database } from '@/database/database';
import { CommuneRepository } from '../../domain/ports/commune.repository';
import { Commune } from '../../domain/models/Commune';

type CommuneRow = {
  id: number;
  nombre: string;
  codigo_postal: number | string | null;
  region_id: number;
  [k: string]: any;
};

@Injectable()
export class PostgreSqlCommuneRepository implements CommuneRepository {
  constructor(private db: Database) {}

  // Helper: Database extends Kysely<Tables> so we can use it to query
  private kysely() {
    return this.db as unknown as any;
  }

  /**
   * Devuelve instancias del dominio Commune mapeando las columnas reales
   * de la tabla (nombre, codigo_postal, region_id) al shape esperado.
   */
  async getByRegionId(regionId: number): Promise<Commune[]> {
    const rows = (await this.kysely()
      .selectFrom('commune')
      // usamos selectAll() para evitar problemas de tipado con Kysely y asegurar
      // que seleccionamos las columnas reales existentes en la tabla
      .selectAll()
      .where('region_id', '=', regionId)
      .execute()) as CommuneRow[];

    return rows.map(
      (r) =>
        new Commune({
          id: r.id,
          name: r.nombre,
          postalCode:
            typeof r.codigo_postal === 'string' ? Number(r.codigo_postal) : r.codigo_postal ?? 0,
          regionId: r.region_id,
        }),
    );
  }

  /**
   * Obtener comuna por id (opcional).
   */
  async getById(communeId: number): Promise<Commune | null> {
    const row = (await this.kysely()
      .selectFrom('commune')
      .selectAll()
      .where('id', '=', communeId)
      .executeTakeFirst()) as CommuneRow | undefined;

    if (!row) return null;

    return new Commune({
      id: row.id,
      name: row.nombre,
      postalCode:
        typeof row.codigo_postal === 'string' ? Number(row.codigo_postal) : row.codigo_postal ?? 0,
      regionId: row.region_id,
    });
  }
}