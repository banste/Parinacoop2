import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap, throwError } from 'rxjs';

import { UpdateProfileDto } from '../interfaces/update-profile.dto';

// Ajusta esta interfaz a lo que realmente devuelve tu backend en profile.profile
export interface ProfileResponse {
  profile: {
    run: number;
    // documentNumber ahora es string
    documentNumber: string;
    names: string;
    firstLastName: string;
    secondLastName: string;
    email: string;
    cellphone: string;
    street: string;
    number: number;
    detail: string;
    regionId: number;
    communeId: number;
  };
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private userProfileSubject = new BehaviorSubject<ProfileResponse['profile'] | null>(null);
  userProfile$ = this.userProfileSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * OJO:
   * Usamos URL RELATIVA: '/profile/...'
   * Si tienes interceptor que agrega baseUrl (http://localhost:3000/api),
   * entonces esto quedará bien: http://localhost:3000/api/profile/...
   */
  getCurrentProfile(run: number): Observable<ProfileResponse['profile']> {
    return this.http.get<ProfileResponse>(`profile/${run}`).pipe(
      map((res) => res.profile),
      tap((profile) => this.userProfileSubject.next(profile)),
      catchError((err) => {
        this.userProfileSubject.next(null);
        return throwError(() => err);
      }),
    );
  }

  updateProfile(dto: UpdateProfileDto): Observable<{ msg: string }> {
    // URL RELATIVA también
    return this.http.patch<{ msg: string }>(`profile/${dto.run}`, {
      // enviar documentNumber como string
      documentNumber: dto.documentNumber,
      names: dto.names,
      firstLastName: dto.firstLastName,
      secondLastName: dto.secondLastName,
      email: dto.email,
      cellphone: dto.cellphone,
      street: dto.street,
      number: dto.number,
      detail: dto.detail,
      regionId: dto.regionId,
      communeId: dto.communeId,
    });
  }

  resetProfile(): void {
    this.userProfileSubject.next(null);
  }

  /** útil para setear desde afuera si quieres */
  setProfile(profile: ProfileResponse['profile']): void {
    this.userProfileSubject.next(profile);
  }
}