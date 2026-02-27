import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type AdminHomeUser = {
  run: number;
  names: string | null;
  firstLastName: string | null;
  secondLastName: string | null;
  email: string | null;
  cellphone: string | null;
};

export type AdminHomeDapRow = {
  id: number;
  userRun: number;
  status: string;
  type: string | null;
  currencyType: string | null;
  days: number | null;
  initialDate: string | null;
  dueDate: string | null;
  initialAmount: number | null;
  finalAmount: number | null;
  user: AdminHomeUser | null;
};

export type AdminHomeResponse = {
  pendingWithAttachments: AdminHomeDapRow[];
  expiredPending: AdminHomeDapRow[];
};

export type AdminBankAccount = {
  userRun: number;
  rutOwner: string;
  bankCode: string;
  bankName: string;
  accountType: string;
  accountNumber: string;
  email: string | null;
};

export type AdminGetBankAccountResponse = {
  run: number;
  clientName: string;
  bankAccount: AdminBankAccount | null;
};

@Injectable({ providedIn: 'root' })
export class AdminHomeDapService {
  constructor(private http: HttpClient) {}

  getHomeDaps(): Observable<AdminHomeResponse> {
    return this.http.get<AdminHomeResponse>('admin/daps/home');
  }

  getBankAccount(run: number): Observable<AdminGetBankAccountResponse> {
    return this.http.get<AdminGetBankAccountResponse>(`admin/clients/${run}/bank-account`);
  }
}