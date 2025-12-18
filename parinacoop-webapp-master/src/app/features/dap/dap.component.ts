import { Component, OnDestroy, OnInit } from '@angular/core';
import { SvgIconComponent } from '@app/shared/components';
import { DapService } from './dap.service';
import { filter, Observable, Subject, Subscription, takeUntil } from 'rxjs';
import { Dap } from './models/dap.model';
import { RouterLink } from '@angular/router';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { DapItemComponent } from './components/dap-item/dap-item.component';
import { AuthService } from '@app/core/auth/services/auth.service';

@Component({
  selector: 'app-dap',
  standalone: true,
  imports: [
    SvgIconComponent,
    DapItemComponent,
    RouterLink,
    AsyncPipe,
    CurrencyPipe,
  ],
  templateUrl: './dap.component.html',
})
export default class DapComponent implements OnInit, OnDestroy {
  userDaps$?: Observable<Dap[] | null>;
  totals$!: Observable<{ profit: number; activeDaps: number }>;
  totalProfit: number = 0;
  totalDaps: number = 0;
  optionSelected: 'ver' | null = null;
  private onDestroy$ = new Subject<void>();

  isLoading = false;

  constructor(
    private authService: AuthService,
    private dapService: DapService,
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.userDaps$ = this.dapService.daps$;
    this.totals$ = this.dapService.totals$;
    this.authService.currentUser$
      .pipe(
        takeUntil(this.onDestroy$),
        filter((user) => user !== null),
      )
      .subscribe((user) => {
        this.dapService.getDapList(user.run);
      });
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }
}
