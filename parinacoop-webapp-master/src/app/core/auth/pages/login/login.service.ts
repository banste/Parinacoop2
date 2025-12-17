import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { LoginResponse } from './interfaces/login.response';
import { AuthService } from '../../services/auth.service';

@Injectable({ providedIn: 'root' })
export class LoginService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly authService: AuthService,
  ) {}

  login(credentials: {
    run: number;
    password: string;
  }): Observable<{ accessToken: string; isClient: boolean }> {
    return this.httpClient.post<LoginResponse>('auth/login', credentials).pipe(
      map(({ accessToken }) => {
        this.authService.saveAccessToken(accessToken);
        return { accessToken, isClient: this.authService.isClient() };
      }),
    );
  }
}
