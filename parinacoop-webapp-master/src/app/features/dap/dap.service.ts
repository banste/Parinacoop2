import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { Dap } from './models/dap.model';
import { DapStatus } from './models/dap-status.enum';

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
}
