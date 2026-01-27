// parinacoop-webapp-master/src/app/features/admin/dap/admin-dap.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Dap } from '@app/features/dap/models/dap.model';

@Injectable({ providedIn: 'root' })
export class AdminDapService {
  private dapsSubject = new BehaviorSubject<Dap[] | null>(null);
  public daps$ = this.dapsSubject.asObservable();

  constructor(private http: HttpClient) {}

  getDapListByRun(run: number): Observable<{ daps: any[] } | null> {
    // <-- quitar el '/api' aquí para evitar duplicarlo con el interceptor/base URL
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
}