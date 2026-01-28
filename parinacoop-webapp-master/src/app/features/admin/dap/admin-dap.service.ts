import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
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
        }));
        this.dapsSubject.next(normalized.sort((a, b) => (b.id ?? 0) - (a.id ?? 0)));
      }),
      catchError((err) => {
        console.error('AdminDapService.getDapListByRun error', err);
        this.dapsSubject.next([]);
        throw err;
      }),
    );
  }

  /**
   * Activa un DAP usando la internalId (ej: número interno aportado por la empresa).
   * Si se proporciona dapId, el backend asociará el internalId al dap antes de activar.
   * Body enviado: { internalId: string, dapId?: number }
   */
  activateDapByInternalId(internalId: string, dapId?: number): Observable<any> {
    const url = `admin/daps/activate`;
    const body: any = { internalId: String(internalId ?? '').trim() };
    if (dapId != null) body.dapId = Number(dapId);
    return this.http.post(url, body);
  }

  /**
   * Variante: activar por dapId numérico (si prefieres endpoint con id en URL)
   */
  activateDapById(dapId: number): Observable<any> {
    const url = `admin/daps/${dapId}/activate`;
    return this.http.post(url, {});
  }

  // ---------------- Admin-only endpoints ----------------

  // Admin: listar adjuntos del DAP
  listAttachmentsAdmin(run: number, dapId: number): Observable<any[]> {
    const url = `admin/clients/${run}/daps/${dapId}/attachments`;
    return this.http.get<any[]>(url);
  }

  // Admin: descargar adjunto (blob)
  downloadAttachmentAdmin(run: number, dapId: number, attachmentId: number) {
    const url = `admin/clients/${run}/daps/${dapId}/attachments/${attachmentId}/download`;
    return this.http.get(url, { responseType: 'blob' as 'json' }) as any;
  }

  // Admin: listar contratos
  listContractsAdmin(run: number, dapId: number): Observable<any[]> {
    const url = `admin/clients/${run}/daps/${dapId}/contracts`;
    return this.http.get<any[]>(url);
  }

  // Admin: descargar contrato (blob)
  downloadContractAdmin(run: number, dapId: number, contractId: number) {
    const url = `admin/clients/${run}/daps/${dapId}/contracts/${contractId}/download`;
    return this.http.get(url, { responseType: 'blob' as 'json' }) as any;
  }
}