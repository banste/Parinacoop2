import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CuentaAhorro } from './models/cuenta-ahorro.model';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class CuentaAhorroService {
  private accountsSubject = new BehaviorSubject<CuentaAhorro[]>([]);
  public accounts$ = this.accountsSubject.asObservable();

  private totalsSubject = new BehaviorSubject<{total: number, interests: number}>({total: 0, interests: 0});
  public totals$ = this.totalsSubject.asObservable();

  constructor(private http: HttpClient) {}

  getClientProfile(run: number): Observable<any> {
    return this.http.get(`profile/${run}`);
  }

  getAhorroList(run: number): void {
    this.http.get<{ cuentas: CuentaAhorro[] }>(`clients/${run}/cuentas-ahorro`).subscribe({
      next: (response) => {
        this.accountsSubject.next(response.cuentas);
        this.getTotals(response.cuentas);
      },
    });
    
  }

  getTotals(cuentas: CuentaAhorro[]) {
    const totals = cuentas.reduce((acc, curr) => {
      acc.total += curr.balance;
      acc.interests += curr.interest;
      return acc;
    }, {total: 0, interests: 0});
    this.totalsSubject.next(totals);
  }
}