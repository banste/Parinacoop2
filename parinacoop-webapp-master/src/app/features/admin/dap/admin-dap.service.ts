import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Dap } from '../../dap/models/dap.model';

@Injectable({ providedIn: 'root' })
export class AdminDapService {
  private dapsSubject = new BehaviorSubject<Dap[] | null>(null);
  public daps$ = this.dapsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Nota: NO incluir '/api' ni '/' al inicio. El interceptor añade el prefijo base.
  getDapListByRun(run: number): Observable<{ daps: any[] } | null> {
    const url = `admin/clients/${run}/daps`;
    return this.http.get<{ daps: any[] }>(url).pipe(
      tap((res) => {
        const raw = Array.isArray(res?.daps) ? res.daps : [];
        // intenta normalizar un poco antes de publicar
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
          internalId: r.internalId ?? r.internal_id ?? r.internal_id_value ?? r.dap_internal_id ?? null,
        }));
        this.dapsSubject.next(normalized.sort((a, b) => (b.id ?? 0) - (a.id ?? 0)));
      }),
      catchError((err) => {
        console.error('AdminDapService.getDapListByRun error', err);
        this.dapsSubject.next([]);
        return throwError(err);
      }),
    );
  }

  activateDapByInternalId(internalId: string, dapId?: number): Observable<any> {
    const url = `admin/daps/activate`;
    const body: any = { internalId: String(internalId ?? '').trim() };
    if (dapId != null) body.dapId = Number(dapId);
    return this.http.post(url, body);
  }

// dentro de la clase AdminDapService
  // Admin: actualiza el status de un DAP
// name=src/app/features/admin/dap/admin-dap.service.ts
updateDapStatus(run: number, dapId: number, status: string): Observable<any> {
  const url = `admin/clients/${run}/daps/${dapId}/status`;
  const body = { status };
  console.log('AdminDapService.updateDapStatus ->', url, body);
  // enviar como objeto (Angular cuidará la serialización)
  return this.http.put(url, body, { observe: 'response' });
}
  // Extras (adjuntos/contratos) - mantenidos para compatibilidad con el componente
  listAttachmentsAdmin(run: number, dapId: number): Observable<any[]> {
    const url = `admin/clients/${run}/daps/${dapId}/attachments`;
    return this.http.get<any[]>(url);
  }

  downloadAttachmentAdmin(run: number, dapId: number, attachmentId: number) {
    const url = `admin/clients/${run}/daps/${dapId}/attachments/${attachmentId}/download`;
    return this.http.get(url, { responseType: 'blob' as 'json' }) as any;
  }

  listContractsAdmin(run: number, dapId: number): Observable<any[]> {
    const url = `admin/clients/${run}/daps/${dapId}/contracts`;
    return this.http.get<any[]>(url);
  }

  downloadContractAdmin(run: number, dapId: number, contractId: number) {
    const url = `admin/clients/${run}/daps/${dapId}/contracts/${contractId}/download`;
    return this.http.get(url, { responseType: 'blob' as 'json' }) as any;
  }
}