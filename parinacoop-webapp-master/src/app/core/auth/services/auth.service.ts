import { Injectable } from '@angular/core';
import { User } from '../../../shared/models/user.model';
import { JwtService } from './jwt.service';
import { LoaderService } from '@app/shared/services';
import { jwtDecode } from 'jwt-decode';
import { Role } from '@app/shared/enums/roles';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private currentUser: User | null = null;
  private accessToken: string = '';

  constructor(
    private httpClient: HttpClient,
    private readonly jwtService: JwtService,
    private readonly loader?: LoaderService // opcional: puede que no esté presente en todos los entornos
  ) {
    // Leer token desde localStorage
    this.accessToken = localStorage.getItem('access_token') || '';

    // Si existe token, decodificarlo y emitir currentUser de forma síncrona
    try {
      if (this.accessToken) {
        const user = jwtDecode<User>(this.accessToken);
        this.currentUser = user;
        this.currentUserSubject.next(user);
      }
    } catch (err) {
      // Si el token está corrupto simplemente lo ignoramos
      console.warn('Token inválido al inicializar AuthService', err);
      this.accessToken = '';
    }
  }

  saveAccessToken(token: string): void {
    this.accessToken = token;
    this.currentUser = jwtDecode<User>(token);
    this.currentUserSubject.next(jwtDecode<User>(token));
    localStorage.setItem('access_token', token);
  }

  getAccessToken(): string {
    return this.accessToken;
  }

  isAuthenticated(): boolean {
    return !!this.jwtService.getToken();
  }

  isClient(): boolean {
    return this.currentUser?.role === Role.CLIENT;
  }

  autoLogin(): void {
    this.httpClient.post<User>('auth/auto-login', {}).subscribe({
      next: (user) => {
        this.currentUserSubject.next(user);
        this.accessToken = localStorage.getItem('access_token') || '';
      },
    });
  }

  logout(): void {
    this.jwtService.destroyToken();
    this.currentUser = null;
    this.currentUserSubject.next(null);
  }

  /**
   * Solicita al backend el envío de código/token para recuperar contraseña.
   * body: { run?: string; email?: string }
   * Devuelve un Observable con la respuesta del servidor.
   */
  forgotPassword(body: { run?: string; email?: string }): Observable<any> {
    // Mostrar loader global de forma segura (no asumir shape exacta del servicio)
    try {
      (this.loader as any)?.show?.();
    } catch {
      // noop si loader no está disponible o no tiene método show
    }

    return this.httpClient.post('auth/forgot-password', body).pipe(
      tap(() => {
        // Side-effects si los necesitas (logging, analytics, ...)
      }),
      catchError((err) => {
        // Normalizar el error para que el componente lo maneje
        console.error('forgotPassword error', err);
        return of({ ok: false, error: err });
      }),
      finalize(() => {
        try {
          (this.loader as any)?.hide?.();
        } catch {}
      })
    );
  }

  /**
   * Resetea la contraseña usando token/código recibido por correo y la nueva password.
   * token: string (código enviado en correo)
   * newPassword: string
   */
  resetPassword(token: string, newPassword: string): Observable<any> {
    try {
      (this.loader as any)?.show?.();
    } catch {}

    return this.httpClient.post('auth/reset-password', { token, newPassword }).pipe(
      tap((res) => {
        // Opcional: si el backend devuelve un token de acceso al resetear, puedes guardarlo:
        // if (res?.accessToken) this.saveAccessToken(res.accessToken);
      }),
      catchError((err) => {
        console.error('resetPassword error', err);
        return of({ ok: false, error: err });
      }),
      finalize(() => {
        try {
          (this.loader as any)?.hide?.();
        } catch {}
      })
    );
  }
}