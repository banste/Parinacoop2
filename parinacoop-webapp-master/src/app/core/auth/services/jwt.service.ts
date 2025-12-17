import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class JwtService { 
  private accessTokenKey = 'access_token';
  getToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  saveToken(token: string): void {
    localStorage.setItem(this.accessTokenKey, token);
  }

  destroyToken(): void {
    localStorage.removeItem(this.accessTokenKey);
  }
}
