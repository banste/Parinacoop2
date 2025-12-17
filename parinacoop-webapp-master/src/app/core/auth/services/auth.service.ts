import { Injectable } from '@angular/core';
import { User } from '../../../shared/models/user.model';
import { JwtService } from './jwt.service';
import { LoaderService } from '@app/shared/services';
import { jwtDecode } from 'jwt-decode';
import { Role } from '@app/shared/enums/roles';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

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
  ) {
    this.accessToken = localStorage.getItem('access_token') || '';
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
  }
}
