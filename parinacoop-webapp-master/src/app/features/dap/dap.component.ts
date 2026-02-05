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

// MatDialog + dialog components
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DapDialogDetailsComponent } from './components/dap-dialog-details/dap-dialog-details.component';
import { DapAttachmentsComponent } from './components/dap-attachments/dap-attachments.component';

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
    MatDialogModule,
    // ensure dialog components are available (they are standalone in repo)
    DapDialogDetailsComponent,
    DapAttachmentsComponent,
  ],
  templateUrl: './dap.component.html',
})
export class DapComponent implements OnInit, OnDestroy {
  userDaps$?: Observable<Dap[] | null>;
  totals$!: Observable<{ totalInvested: number; activeCount: number }>;
  private onDestroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private dapService: DapService,
    private dialog: MatDialog
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

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  // -----------------------
  // Handlers recibidos desde el hijo (emitted events)
  // -----------------------
  openDialog(dap: Dap) {
    if (!dap) return;
    this.dialog.open(DapDialogDetailsComponent, {
      width: '680px',
      autoFocus: true,
      restoreFocus: true,
      data: dap,
    });
  }

  openAttachments(dap: Dap) {
    if (!dap) return;
    // Si necesitas el userRun como en la versión original, resuelve aquí:
    this.dialog.open(DapAttachmentsComponent, {
      width: '720px',
      maxHeight: '80vh',
      panelClass: 'dap-dialog',
      data: { dapId: dap.id, userRun: (dap as any).userRun ?? null },
    });
  }
}