// (Note: URL in header points to the repo; replace if needed)
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { Dap } from './models/dap.model';
import { DapStatus } from './models/dap-status.enum';

export interface DapAttachment {
  id: number;
  dap_id: number;
  type: string;
  filename: string;
  storage_path?: string;
  uploaded_by_run?: number;
  created_at?: string;
}

export interface DapContract {
  id: number;
  dap_id: number;
  filename: string;
  storage_path?: string;
  uploaded_by_run?: number;
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class DapService {
  private dapsSubject = new BehaviorSubject<Dap[] | null>(null);
  public daps$ = this.dapsSubject.asObservable();

  private initialTotals = { profit: 0, activeDaps: 0 };
  private totalsSubject = new BehaviorSubject<{
    profit: number;
    activeDaps: number;
  }>(this.initialTotals);
  public totals$ = this.totalsSubject.asObservable();

  // ✅ NUEVO: guardamos el RUN actual
  private currentRunSubject = new BehaviorSubject<number | null>(null);

  constructor(private httpClient: HttpClient) {}

  // ✅ Getter simple para que lo use el diálogo
  getCurrentRun(): number | null {
    return this.currentRunSubject.value;
  }

  getDapList(run: number): void {
    // ✅ guardamos el run usado para cargar la lista
    this.currentRunSubject.next(run);

    this.httpClient.get<{ daps: Dap[] }>(`clients/${run}/daps`).subscribe({
      next: (response) => {
        this.dapsSubject.next(response.daps.sort((a, b) => b.id - a.id));
        this.getTotals(response.daps);
      },
      error: (err) => console.error(err),
    });
  }

  getTotals(dapList: Dap[]): void {
    const totals = dapList.reduce(
      (previous, current) => {
        if (current.status !== DapStatus.ACTIVE) return previous;
        previous.profit += current.profit;
        previous.activeDaps += current.initialAmount;
        return previous;
      },
      { profit: 0, activeDaps: 0 },
    );

    this.totalsSubject.next(totals);
  }

  // ✅ GET /api/clients/:run/daps/:dapId/solicitud-pdf
  downloadSolicitudPdf(userRun: number, dapId: number) {
    return this.httpClient.get(
      `clients/${userRun}/daps/${dapId}/solicitud-pdf`,
      { responseType: 'blob' },
    );
  }

  // ✅ GET /api/clients/:run/daps/:dapId/instructivo-pdf
  downloadInstructivoPdf(userRun: number, dapId: number) {
    return this.httpClient.get(
      `clients/${userRun}/daps/${dapId}/instructivo-pdf`,
      { responseType: 'blob' },
    );
  }

  // -----------------------------
  // Attachments (upload / list / download / delete)
  // -----------------------------

  uploadAttachment(
    userRun: number,
    dapId: number,
    file: File,
    type: 'receipt' | 'signed_document',
  ): Observable<DapAttachment> {
    return new Observable<DapAttachment>((observer) => {
      const reader = new FileReader();
      reader.onerror = (err) => observer.error(err);
      reader.onload = () => {
        try {
          const dataUrl = reader.result as string;
          const idx = dataUrl.indexOf(';base64,');
          const base64 = idx >= 0 ? dataUrl.slice(idx + ';base64,'.length) : dataUrl;

          const body = {
            filename: file.name,
            contentBase64: base64,
            type,
          };

          this.httpClient
            .post<DapAttachment>(`clients/${userRun}/daps/${dapId}/attachments`, body)
            .subscribe({
              next: (v) => {
                observer.next(v);
                observer.complete();
              },
              error: (e) => observer.error(e),
            });
        } catch (e) {
          observer.error(e);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  listAttachments(userRun: number, dapId: number): Observable<DapAttachment[]> {
    return this.httpClient.get<DapAttachment[]>(`clients/${userRun}/daps/${dapId}/attachments`);
  }

  downloadAttachment(userRun: number, dapId: number, attachmentId: number): Observable<Blob> {
    return this.httpClient.get(
      `clients/${userRun}/daps/${dapId}/attachments/${attachmentId}/download`,
      { responseType: 'blob' },
    );
  }

  deleteAttachment(userRun: number, dapId: number, attachmentId: number) {
    return this.httpClient.delete<void>(
      `clients/${userRun}/daps/${dapId}/attachments/${attachmentId}`,
    );
  }

  // -----------------------------
  // Contracts (upload / list / download / delete)
  // -----------------------------

  uploadContract(userRun: number, dapId: number, file: File): Observable<DapContract> {
    return new Observable<DapContract>((observer) => {
      const reader = new FileReader();
      reader.onerror = (err) => observer.error(err);
      reader.onload = () => {
        try {
          const dataUrl = reader.result as string;
          const idx = dataUrl.indexOf(';base64,');
          const base64 = idx >= 0 ? dataUrl.slice(idx + ';base64,'.length) : dataUrl;

          const body = {
            filename: file.name,
            contentBase64: base64,
          };

          this.httpClient
            .post<DapContract>(`clients/${userRun}/daps/${dapId}/contracts`, body)
            .subscribe({
              next: (v) => {
                observer.next(v);
                observer.complete();
              },
              error: (e) => observer.error(e),
            });
        } catch (e) {
          observer.error(e);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  listContracts(userRun: number, dapId: number): Observable<DapContract[]> {
    return this.httpClient.get<DapContract[]>(`clients/${userRun}/daps/${dapId}/contracts`);
  }

  downloadContract(userRun: number, dapId: number, contractId: number): Observable<Blob> {
    return this.httpClient.get(
      `clients/${userRun}/daps/${dapId}/contracts/${contractId}/download`,
      { responseType: 'blob' },
    );
  }

  deleteContract(userRun: number, dapId: number, contractId: number) {
    return this.httpClient.delete<void>(
      `clients/${userRun}/daps/${dapId}/contracts/${contractId}`,
    );
  }
}