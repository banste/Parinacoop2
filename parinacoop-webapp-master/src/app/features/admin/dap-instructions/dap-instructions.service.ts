import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type DapInstructionsResponse = {
  bankName: string;
  accountType: string;
  accountNumber: string;
  accountHolderName: string;
  accountHolderRut: string;
  email?: string | null;
  description: string; // texto del instructivo
};

@Injectable({ providedIn: 'root' })
export class DapInstructionsService {
  // ✅ URL RELATIVA (el baseUrl viene de tu environment/interceptor)
  private readonly url = 'admin/dap-instructions';

  constructor(private readonly http: HttpClient) {}

  get() {
    return this.http.get<DapInstructionsResponse>(this.url);
  }

  update(payload: DapInstructionsResponse) {
    return this.http.put<DapInstructionsResponse>(this.url, payload);
  }
}
