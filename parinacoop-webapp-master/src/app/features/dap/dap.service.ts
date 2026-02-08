import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

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

  private currentRunSubject = new BehaviorSubject<number | null>(null);

  constructor(private httpClient: HttpClient) {}

  getCurrentRun(): number | null {
    return this.currentRunSubject.value;
  }

  /**
   * getDapList:
   * - obtiene la lista desde el backend
   * - normaliza cada registro
   * - EXCLUYE los DAPs cuyo status sea 'cancelled' (case-insensitive)
   * - emite la lista visible y recalcula totales
   */
  getDapList(run: number): void {
    this.currentRunSubject.next(run);

    this.httpClient.get<{ daps: any[] }>(`clients/${run}/daps`).subscribe({
      next: (response) => {
        const raw = Array.isArray(response?.daps) ? response.daps : [];
        const normalized: Dap[] = raw.map((r: any) => ({
          id: Number(r.id ?? r.dap_id ?? 0),
          userRun: Number(r.userRun ?? r.user_run ?? 0),
          type: r.type ?? r.type_name ?? null,
          currencyType: r.currencyType ?? r.currency_type ?? 'CLP',
          status: (r.status ?? r.estado ?? '').toString(),
          days: Number(r.days ?? r.period_days ?? 0),
          initialDate: r.initialDate ? new Date(r.initialDate) : (r.initial_date ? new Date(r.initial_date) : null),
          initialAmount: Number(r.initialAmount ?? r.initial_amount ?? 0),
          finalAmount: Number(r.finalAmount ?? r.final_amount ?? 0),
          dueDate: r.dueDate ? new Date(r.dueDate) : (r.due_date ? new Date(r.due_date) : null),
          profit: Number(r.profit ?? r.ganancia ?? 0),
          interestRateInMonth: Number(r.interestRateInMonth ?? r.interest_rate_month ?? 0),
          interestRateInPeriod: Number(r.interestRateInPeriod ?? r.interest_rate_period ?? 0),
          // Leer internalId si el backend la devuelve con alguno de los aliases comunes
          internalId: r.internalId ?? r.internal_id ?? r.dap_internal_id ?? r.internal_id_value ?? null,
        }));

        // FILTRO: excluir DAPs con status 'cancelled' (case-insensitive)
        const visible = normalized
          .filter((d) => {
            const s = (d.status ?? '').toString().toLowerCase().trim();
            return s !== 'cancelled';
          })
          // ordenar descendente por id (igual que antes)
          .sort((a, b) => (b.id ?? 0) - (a.id ?? 0));

        // Emitir la lista filtrada y recalcular totales sobre la lista visible
        this.dapsSubject.next(visible);
        this.getTotals(visible);
      },
      error: (err) => {
        console.error('getDapList error', err);
        // En caso de error emitimos lista vacía y totales iniciales para evitar estados inconsistentes
        this.dapsSubject.next([]);
        this.totalsSubject.next(this.initialTotals);
      },
    });
  }

  /**
   * Calcula totales a partir de la lista entregada.
   * Mantengo la lógica previa: sumamos profit y acumulamos initialAmount
   * solo para DAPs cuyo estado sea ACTIVE.
   */
  getTotals(dapList: Dap[]): void {
    const totals = dapList.reduce(
      (previous, current) => {
        const status = (current?.status ?? '').toString().toLowerCase();

        // considerar ACTIVE únicamente (comparamos con el enum DapStatus)
        if (status !== String(DapStatus.ACTIVE).toLowerCase()) return previous;

        const profit = Number((current as any).profit ?? 0);
        const initial = Number((current as any).initialAmount ?? 0);

        previous.profit += isNaN(profit) ? 0 : profit;
        previous.activeDaps += isNaN(initial) ? 0 : initial;
        return previous;
      },
      { profit: 0, activeDaps: 0 },
    );

    console.debug('DAP totals computed in service:', totals);
    this.totalsSubject.next(totals);
  }

  // GET single DAP (useful to read attachments_locked if backend provides it)
  getDap(run: number, dapId: number): Observable<any> {
    return this.httpClient.get<any>(`clients/${run}/daps/${dapId}`);
  }

  // PATCH to lock attachments (backend must implement it; if not, call may 404/404 handled)
  lockAttachments(run: number, dapId: number): Observable<void> {
    return this.httpClient.patch<void>(`clients/${run}/daps/${dapId}/attachments/lock`, {});
  }

  // DOWNLOAD helper endpoints (used from dialog/details)
  downloadSolicitudPdf(userRun: number, dapId: number): Observable<Blob> {
    return this.httpClient.get(`clients/${userRun}/daps/${dapId}/solicitud-pdf`, { responseType: 'blob' });
  }

  downloadInstructivoPdf(userRun: number, dapId: number): Observable<Blob> {
    return this.httpClient.get(`clients/${userRun}/daps/${dapId}/instructivo-pdf`, { responseType: 'blob' });
  }

  // Upload attachment using base64 (current approach). If your backend accepts multipart,
  // consider switching to FormData (more efficient).
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

          console.debug('uploadAttachment: POST to', `clients/${userRun}/daps/${dapId}/attachments`, 'filename=', file.name);

          this.httpClient.post<DapAttachment>(`clients/${userRun}/daps/${dapId}/attachments`, body).subscribe({
            next: (v) => {
              observer.next(v);
              observer.complete();

              // optimistic: request backend to lock (if implemented)
              this.lockAttachments(userRun, dapId).subscribe({
                next: () => this.getDapList(userRun),
                error: (e) => console.debug('lockAttachments failed (may be unsupported):', e),
              });
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
    return this.httpClient.get(`clients/${userRun}/daps/${dapId}/attachments/${attachmentId}/download`, { responseType: 'blob' });
  }

  deleteAttachment(userRun: number, dapId: number, attachmentId: number) {
    return this.httpClient.delete<void>(`clients/${userRun}/daps/${dapId}/attachments/${attachmentId}`);
  }

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

          this.httpClient.post<DapContract>(`clients/${userRun}/daps/${dapId}/contracts`, body).subscribe({
            next: (v) => { observer.next(v); observer.complete(); },
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
    return this.httpClient.get(`clients/${userRun}/daps/${dapId}/contracts/${contractId}/download`, { responseType: 'blob' });
  }

  deleteContract(userRun: number, dapId: number, contractId: number) {
    return this.httpClient.delete<void>(`clients/${userRun}/daps/${dapId}/contracts/${contractId}`);
  }

  /**
   * Devuelve los DAP cancelados para un run.
   * Normaliza la respuesta igual que en getDapList.
   */
  getCancelledList(run: number): Observable<Dap[]> {
    return this.httpClient.get<{ daps: any[] }>(`clients/${run}/daps/cancelled`).pipe(
      map((response) => {
        const raw = Array.isArray(response?.daps) ? response.daps : [];
        const normalized: Dap[] = raw.map((r: any) => ({
          id: Number(r.id ?? r.dap_id ?? 0),
          userRun: Number(r.userRun ?? r.user_run ?? 0),
          type: r.type ?? r.type_name ?? null,
          currencyType: r.currencyType ?? r.currency_type ?? 'CLP',
          status: (r.status ?? r.estado ?? '').toString(),
          days: Number(r.days ?? r.period_days ?? 0),
          initialDate: r.initialDate ? new Date(r.initialDate) : (r.initial_date ? new Date(r.initial_date) : null),
          initialAmount: Number(r.initialAmount ?? r.initial_amount ?? 0),
          finalAmount: Number(r.finalAmount ?? r.final_amount ?? 0),
          dueDate: r.dueDate ? new Date(r.dueDate) : (r.due_date ? new Date(r.due_date) : null),
          profit: Number(r.profit ?? r.ganancia ?? 0),
          interestRateInMonth: Number(r.interestRateInMonth ?? r.interest_rate_month ?? 0),
          interestRateInPeriod: Number(r.interestRateInPeriod ?? r.interest_rate_period ?? 0),
          internalId: r.internalId ?? r.internal_id ?? r.dap_internal_id ?? r.internal_id_value ?? null,
        }));
        return normalized.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
      }),
    );
  }
}