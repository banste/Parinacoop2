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
  ],
  templateUrl: './dap.component.html',
  styleUrls: ['./dap.component.scss'], // <- aseguramos que el SCSS se cargue
})
export class DapComponent implements OnInit, OnDestroy {
  userDaps$?: Observable<Dap[] | null>;

  // Totals derivados directamente desde daps$
  totals$!: Observable<{ totalInvested: number; activeCount: number }>;

  private onDestroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private dapService: DapService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.userDaps$ = this.dapService.daps$;

    // Derivar los totales desde la lista de daps recibida.
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
        this.dapService.getDapList((user as any).run);
      });
  }

  trackById(_: number, item: Dap): number | null {
    return item?.id ?? null;
  }

  // Handler llamado desde la plantilla: abre el diálogo de detalle
  openDialog(dap: Dap): void {
    try {
      this.dialog.open(DapDialogDetailsComponent, {
        width: '680px',
        autoFocus: true,
        restoreFocus: true,
        data: dap,
      });
    } catch (err) {
      console.error('openDialog error', err);
    }
  }

  // Handler llamado desde la plantilla: abre el diálogo de adjuntos
  openAttachments(dap: Dap): void {
    // necesitamos el run del usuario; lo obtenemos una sola vez
    this.authService.currentUser$.pipe(take(1)).subscribe((user) => {
      try {
        this.dialog.open(DapAttachmentsComponent, {
          width: '720px',
          maxHeight: '80vh',
          panelClass: 'dap-dialog',
          data: {
            dapId: dap.id,
            userRun: (user as any)?.run ?? null,
          },
        });
      } catch (err) {
        console.error('openAttachments error', err);
      }
    });
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }
}