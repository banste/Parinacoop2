import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminUser } from './user.model';

/**
 * Servicio para llamadas CRUD de usuarios en la sección admin.
 * Rutas relativas: 'admin/users' — el interceptor de la app debe añadir el prefijo /api y Authorization.
 */
@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  // Ajusta base si tu backend usa otro prefijo (el interceptor suele añadir /api)
  private base = 'admin/users';

  constructor(private readonly http: HttpClient) {}

  /**
   * Listado paginado de administradores/usuarios.
   * Devuelve { data: AdminUser[], total?: number } si el backend lo provee.
   */
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

  /**
   * Atajo para obtener muchos usuarios (usar con cuidado en producción).
   * Útil como fallback cuando quieres calcular totales si no existe endpoint de counts.
   */
  getAll(perPage = 1000, q?: string): Observable<{ data: AdminUser[]; total?: number }> {
    return this.list({ q, page: 1, perPage });
  }

  /**
   * Endpoint recomendado: obtener conteos de usuarios activos / inactivos
   * (backend: GET /api/admin/users/counts)
   */
  usersCounts(): Observable<{ active?: number; inactive?: number }> {
    const url = `${this.base}/counts`;
    return this.http.get<{ active?: number; inactive?: number }>(url);
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