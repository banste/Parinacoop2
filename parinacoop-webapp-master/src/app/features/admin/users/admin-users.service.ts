import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminUser } from './user.model';

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  // Ajusta base si tu backend usa un prefijo (p.ej. 'api/admin/users')
  private base = 'admin/users';

  constructor(private readonly http: HttpClient) {}

  list(params?: { q?: string; page?: number; perPage?: number }): Observable<{ data: AdminUser[]; total?: number }> {
    let httpParams = new HttpParams();
    const q = params?.q ?? '';
    const qTrim = String(q ?? '').trim();
    if (qTrim !== '') {
      httpParams = httpParams.set('q', qTrim);
    }
    if (params?.page) httpParams = httpParams.set('page', String(params.page));
    if (params?.perPage) httpParams = httpParams.set('perPage', String(params.perPage));
    return this.http.get<{ data: AdminUser[]; total?: number }>(`${this.base}`, { params: httpParams });
  }

  get(id: number): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.base}/${id}`);
  }

  create(payload: Partial<AdminUser>): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${this.base}`, payload);
  }

  update(id: number, payload: Partial<AdminUser>): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}