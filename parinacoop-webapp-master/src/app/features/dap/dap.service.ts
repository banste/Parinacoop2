import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Dap } from './models/dap.model';
import { DapStatus } from './models/dap-status.enum';
import { HttpClient } from '@angular/common/http';

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

  constructor(private httpClient: HttpClient) {}

  getDapList(run: number): void {
    this.httpClient.get<{ daps: Dap[] }>(`clients/${run}/daps`).subscribe({
      next: (response) => {
        this.dapsSubject.next(response.daps.sort((a, b) => b.id - a.id));
        this.getTotals(response.daps);
      },
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
    console.log(totals);
    
    this.totalsSubject.next(totals);
  }
  downloadSolicitudPdf(dapId: number, userRun: number) {
  return this.httpClient.get(
    `clients/${userRun}/daps/${dapId}/solicitud-pdf`,
    { responseType: 'blob' },
  );
}

downloadInstructivoPdf(userRun: number) {
  return this.httpClient.get(
    `clients/${userRun}/daps/instructivo-pdf`,
    { responseType: 'blob' },
  );
}

}
