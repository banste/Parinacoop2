import { Component, OnDestroy, OnInit } from '@angular/core';
import { SvgIconComponent } from '@app/shared/components';
import { DapService } from './dap.service';
import { filter, Observable, Subject, takeUntil } from 'rxjs';
import { map } from 'rxjs/operators';
import { Dap } from './models/dap.model';
import { DapStatus } from './models/dap-status.enum';
import { RouterLink } from '@angular/router';
import { CommonModule, AsyncPipe, CurrencyPipe } from '@angular/common';
import { DapItemComponent } from './components/dap-item/dap-item.component';
import { AuthService } from '@app/core/auth/services/auth.service';

@Component({
  selector: 'app-dap',
  standalone: true,
  imports: [
    CommonModule,
    SvgIconComponent,
    DapItemComponent,
    RouterLink,
    AsyncPipe,
    CurrencyPipe,
  ],
  templateUrl: './dap.component.html',
})
export class DapComponent implements OnInit, OnDestroy {
  userDaps$?: Observable<Dap[] | null>;

  // Totals derivados directamente desde daps$
  totals$!: Observable<{ profit: number; activeDaps: number }>;

  private onDestroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private dapService: DapService,
  ) {}

  ngOnInit(): void {
    this.userDaps$ = this.dapService.daps$;

    // Derivar los totales desde la lista de daps recibida.
    // Forzamos Number(...) para manejar casos donde la API devuelva strings.
    this.totals$ = (this.userDaps$ ?? this.dapService.daps$).pipe(
      // map sobre el arreglo; si es null => totales 0
      map((daps) => {
        const list = daps ?? [];
        const totals = list.reduce(
          (prev, curr) => {
            // Consideramos sólo depósitos ACTIVE (idéntico a la lógica previa del servicio)
            if (curr?.status !== DapStatus.ACTIVE) return prev;
            const profit = Number(curr?.profit ?? 0);
            const initial = Number(curr?.initialAmount ?? 0);
            prev.profit += isNaN(profit) ? 0 : profit;
            prev.activeDaps += isNaN(initial) ? 0 : initial;
            return prev;
          },
          { profit: 0, activeDaps: 0 },
        );
        console.debug('DAP totals (derived):', totals);
        return totals;
      }),
    );

    this.authService.currentUser$
      .pipe(
        takeUntil(this.onDestroy$),
        filter((user) => user !== null),
      )
      .subscribe((user) => {
        // Llamada que poblará daps$ y por ende totals$
        this.dapService.getDapList(user.run);
      });
  }

  trackById(_: number, item: Dap): number | null {
    return item?.id ?? null;
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }
}