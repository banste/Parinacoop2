import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, delay, Observable } from 'rxjs';
import { TermOption } from './models/TermOption';
import { CreateDap } from './interfaces/create-dap';
import { Dap } from '../../models/dap.model';

@Injectable({
  providedIn: 'root',
})
export class NewDapService {
  private termOptionsSubject = new BehaviorSubject<TermOption[] | null>(null);
  termOptions$ = this.termOptionsSubject.asObservable();

  constructor(
    private httpClient: HttpClient,
  ) {}

  getTermOptions(type: string, initialAmount: number): void {
    console.log(initialAmount);

    this.httpClient
      .post<{ sDaps: TermOption[] }>('dap/simulate', { type, initialAmount }).pipe(delay(500))
      .subscribe((res) => {
        this.termOptionsSubject.next(res.sDaps);
      });
  }

  resetTermOptions(): void {
    this.termOptionsSubject.next(null);
  }

  createDap(data: CreateDap): Observable<any> {
    return this.httpClient.post<{ dap: Dap }>('dap', data);
  }
}
