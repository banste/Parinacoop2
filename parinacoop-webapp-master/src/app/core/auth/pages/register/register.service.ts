import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface RegisterPayload {
  run: number;
  documentNumber: number;
  email: string;
  cellphone: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class RegisterService {
  constructor(private readonly httpClient: HttpClient) {}

  // Ajusta la ruta si tu backend usa otra URL
  register(payload: RegisterPayload): Observable<any> {
    return this.httpClient.post<any>('auth/register', payload);
  }
}