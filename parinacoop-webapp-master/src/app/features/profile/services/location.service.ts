import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
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

  getRegions(): void {
    this.httpClient.get<{ regions: Region[] }>('regions').subscribe((data) => {
      this.regionsSubject.next(data.regions);
    });
  }

  getCommunesByRegionId(regionId: number): void {
    this.httpClient
      .get<{ communes: Commune[] }>(`regions/${regionId}/communes`)
      .subscribe((data) => {
        this.communesSubject.next(data.communes);
      });
  }
}
