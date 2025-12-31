import { Component, OnDestroy, OnInit } from '@angular/core';
import { SvgIconComponent } from '@app/shared/components';
import { DapService } from './dap.service';
import { filter, Observable, Subject, takeUntil } from 'rxjs';
import { Dap } from './models/dap.model';
import { RouterLink } from '@angular/router';
import { CommonModule, AsyncPipe, CurrencyPipe } from '@angular/common';
import { DapItemComponent } from './components/dap-item/dap-item.component';
import { AuthService } from '@app/core/auth/services/auth.service';
import { DapAttachmentsComponent } from './components/dap-attachments/dap-attachments.component';

@Component({
  selector: 'app-dap',
  standalone: true,
  imports: [
    CommonModule,              // necesario para *ngIf, *ngFor, etc.
    SvgIconComponent,
    DapItemComponent,
    RouterLink,
    AsyncPipe,
    CurrencyPipe,
    DapAttachmentsComponent,
  ],
  templateUrl: './dap.component.html',
})
export default class DapComponent implements OnInit, OnDestroy {
  userDaps$?: Observable<Dap[] | null>;
  totals$!: Observable<{ profit: number; activeDaps: number }>;
  totalProfit: number = 0;
  totalDaps: number = 0;
  private onDestroy$ = new Subject<void>();

  isLoading = false;

  // id del DAP seleccionado para mostrar attachments/contracts
  selectedDapId: number | null = null;

  // Hacer authService público para poder usar (authService.currentUser$ | async) en template
  constructor(
    public authService: AuthService,
    private dapService: DapService,
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.userDaps$ = this.dapService.daps$;
    this.totals$ = this.dapService.totals$;

    // Auto-seleccionar primer DAP cuando la lista llegue (opcional)
    this.userDaps$
      ?.pipe(takeUntil(this.onDestroy$))
      .subscribe((daps) => {
        if (daps && daps.length && !this.selectedDapId) {
          this.selectedDapId = daps[0].id;
        }
      });

    this.authService.currentUser$
      .pipe(
        takeUntil(this.onDestroy$),
        filter((user) => user !== null),
      )
      .subscribe((user) => {
        this.dapService.getDapList(user.run);
      });
  }

  selectDap(dapId: number): void {
    this.selectedDapId = dapId;
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }
}