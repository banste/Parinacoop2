import { Component, OnDestroy, OnInit } from '@angular/core';
import { SvgIconComponent } from '@app/shared/components';
import { DapService } from './dap.service';
import { filter, Observable, Subject, takeUntil } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { Dap } from './models/dap.model';
import { DapStatus } from './models/dap-status.enum';
import { RouterLink } from '@angular/router';
import { CommonModule, AsyncPipe, CurrencyPipe } from '@angular/common';
import { DapItemComponent } from './components/dap-item/dap-item.component';
import { DapSummaryComponent } from './components/dap-summary/dap-summary.component';
import { AuthService } from '@app/core/auth/services/auth.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DapDialogDetailsComponent } from './components/dap-dialog-details/dap-dialog-details.component';
import { DapAttachmentsComponent } from './components/dap-attachments/dap-attachments.component';

import {
  DapCollectDialogComponent,
  DapCollectDialogResult,
} from './components/dap-collect-dialog/dap-collect-dialog.component';

@Component({
  selector: 'app-dap',
  standalone: true,
  imports: [
    CommonModule,
    SvgIconComponent,
    DapItemComponent,
    DapSummaryComponent,
    RouterLink,
    AsyncPipe,
    CurrencyPipe,
    MatDialogModule,
    DapDialogDetailsComponent,
    DapAttachmentsComponent,
    DapCollectDialogComponent,
  ],
  templateUrl: './dap.component.html',
  styleUrls: ['./dap.component.scss'],
})
export class DapComponent implements OnInit, OnDestroy {
  userDaps$?: Observable<Dap[] | null>;
  totals$!: Observable<{ totalInvested: number; activeCount: number }>;
  private onDestroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private dapService: DapService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.userDaps$ = this.dapService.daps$;

    this.totals$ = (this.userDaps$ ?? this.dapService.daps$).pipe(
      map((daps) => {
        const list = daps ?? [];
        const totals = list.reduce(
          (prev, curr) => {
            const initial = Number(curr?.initialAmount ?? 0);
            prev.totalInvested += isNaN(initial) ? 0 : initial;

            const status = String(curr?.status ?? '').toLowerCase();
            if (status === String(DapStatus.ACTIVE).toLowerCase()) {
              prev.activeCount += 1;
            }
            return prev;
          },
          { totalInvested: 0, activeCount: 0 },
        );
        return totals;
      }),
    );

    this.authService.currentUser$
      .pipe(
        takeUntil(this.onDestroy$),
        filter((user) => user !== null),
      )
      .subscribe((user) => {
        this.dapService.getDapList((user as any).run);
      });
  }

  trackById(_: number, item: Dap): number | null {
    return item?.id ?? null;
  }

  openDialog(dap: Dap): void {
    this.dialog.open(DapDialogDetailsComponent, {
      width: '680px',
      autoFocus: true,
      restoreFocus: true,
      data: dap,
    });
  }

  openAttachments(dap: Dap): void {
    this.authService.currentUser$.pipe(take(1)).subscribe((user) => {
      this.dialog.open(DapAttachmentsComponent, {
        width: '720px',
        maxHeight: '80vh',
        panelClass: 'dap-dialog',
        data: {
          dapId: dap.id,
          userRun: (user as any)?.run ?? null,
        },
      });
    });
  }

  openCollectDialog(dap: Dap): void {
    this.authService.currentUser$.pipe(take(1)).subscribe((user) => {
      const run = Number((user as any)?.run ?? 0);
      const dapId = Number((dap as any)?.id ?? 0);

      if (!run || isNaN(run)) {
        alert('No se pudo obtener RUN del usuario.');
        return;
      }

      const ref = this.dialog.open(DapCollectDialogComponent, {
        width: '920px',
        maxWidth: '95vw',
        maxHeight: '85vh',
        panelClass: 'dap-dialog',
        autoFocus: true,
        restoreFocus: true,
        data: { run, dapId },
      });

      ref.afterClosed().subscribe((result: DapCollectDialogResult | undefined) => {
        if (!result) return;
        if (result.action !== 'charge') return;

        this.dapService.collectDap(run, dapId).subscribe({
          next: () => {
            alert('Cobro solicitado. Tu depósito quedó en estado: Cobro pendiente.');
            this.dapService.getDapList(run);
          },
          error: (err: any) => {
            console.error('collectDap error', err);
            alert(err?.error?.message ?? err?.message ?? 'No se pudo solicitar el cobro.');
          },
        });
      });
    });
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }
}