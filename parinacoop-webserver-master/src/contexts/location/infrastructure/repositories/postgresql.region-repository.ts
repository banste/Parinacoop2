// src/contexts/location/infrastructure/repositories/postgresql.region-repository.ts
import { Injectable, Inject } from '@nestjs/common';
import { Database } from '@/database/database';
import { Region } from '../../domain/models/Region';
import { RegionRepository } from '../../domain/ports/region.repository';
import { Injectable as LocalInjectable } from '@/contexts/shared/dependency-injection/injectable'; // mantiene compatibilidad si usáis ese decorator

type RegionRow = {
  id_region: number;
  nombre: string;
  numero_romano: string | null;
  numero: number | null;
  abreviacion: string | null;
  [k: string]: any;
};

@Injectable()
export class PostgreSqlRegionRepository implements RegionRepository {
  constructor(@Inject(Database) private readonly db: Database) {}

  private kysely() {
    return this.db as unknown as any; // Database extiende Kysely<Tables>
  }

  /**
   * Devuelve instancias de Region (domain model) construidas a partir de las filas
   * de la base de datos. Mapeamos los nombres de columna reales (id_region, nombre, ...)
   * al shape que espera el dominio (id, name, romanNumber, number, abbreviation).
   */
  async getAll(): Promise<Region[]> {
    const rows = (await this.kysely()
      .selectFrom('region')
      .select(['id_region', 'nombre', 'numero_romano', 'numero', 'abreviacion'])
      .execute()) as RegionRow[];

    return rows.map(
      (r) =>
        new Region({
          id: r.id_region,
          name: r.nombre,
          romanNumber: r.numero_romano ?? '',
          number: r.numero ?? 0,
          abbreviation: r.abreviacion ?? '',
        }),
    );
  }

  async getById(regionId: number): Promise<Region | null> {
    const row = (await this.kysely()
      .selectFrom('region')
      .select(['id_region', 'nombre', 'numero_romano', 'numero', 'abreviacion'])
      .where('id_region', '=', regionId)
      .executeTakeFirst()) as RegionRow | undefined;

    if (!row) return null;

    return new Region({
      id: row.id_region,
      name: row.nombre,
      romanNumber: row.numero_romano ?? '',
      number: row.numero ?? 0,
      abbreviation: row.abreviacion ?? '',
    });
  }
}