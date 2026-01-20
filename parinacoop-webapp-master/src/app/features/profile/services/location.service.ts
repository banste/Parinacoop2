import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Commune } from '../models/Commune';
import { Region } from '../models/Region';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private regionsSubject = new BehaviorSubject<Region[]>([]);
  public regions$ = this.regionsSubject.asObservable();

  private communesSubject = new BehaviorSubject<Commune[]>([]);
  public communes$ = this.communesSubject.asObservable();

  constructor(private httpClient: HttpClient) {}

  /**
   * Llama al endpoint /regions y normaliza las filas devueltas por el backend
   * al shape que espera el frontend: Region { id, name }.
   */
  getRegions(): void {
    this.httpClient
      .get<{ regions: any[] }>('regions')
      .pipe(
        map((data) =>
          (data.regions || []).map((r) => ({
            // backend devuelve id_region, nombre
            id: r.id_region ?? r.id ?? r.idRegion,
            name: r.nombre ?? r.name ?? r.nombre_region,
          })),
        ),
      )
      .subscribe((regions) => {
        this.regionsSubject.next(regions);
      });
  }

  /**
   * Llama al endpoint /regions/:id/communes y normaliza las filas a Commune { id, name }.
   */
  getCommunesByRegionId(regionId: number): void {
    this.httpClient
      .get<{ communes: any[] }>(`regions/${regionId}/communes`)
      .pipe(
        map((data) =>
          (data.communes || []).map((c) => ({
            id: c.id ?? c.id_commune ?? c.id_commune ?? c.id,
            name: c.nombre ?? c.name ?? c.nombre_comuna,
          })),
        ),
      )
      .subscribe((communes) => {
        this.communesSubject.next(communes);
      });
  }
}