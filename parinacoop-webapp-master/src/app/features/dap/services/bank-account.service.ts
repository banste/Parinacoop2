import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BankAccount {
  userRun: number;
  rutOwner: string;
  bankCode: string;
  bankName: string;
  accountType: string;
  accountNumber: string;
  email: string | null;
}

export interface GetBankAccountResponse {
  run: number;
  clientName: string;
  bankAccount: BankAccount | null;
}

export interface UpsertBankAccountPayload {
  rutOwner: string;
  bankCode: string;
  bankName: string;
  accountType: string;
  accountNumber: string;
  email?: string;
}

@Injectable({ providedIn: 'root' })
export class BankAccountService {
  constructor(private http: HttpClient) {}

  get(run: number): Observable<GetBankAccountResponse> {
    return this.http.get<GetBankAccountResponse>(`clients/${run}/bank-account`);
  }

  upsert(run: number, payload: UpsertBankAccountPayload): Observable<{ ok: true }> {
    return this.http.put<{ ok: true }>(`clients/${run}/bank-account`, payload);
  }
}