// (reemplaza el archivo actual por este; mantuve los imports y el resto igual)
import { CommonModule, CurrencyPipe, DatePipe, NgClass, PercentPipe } from '@angular/common';
import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { take } from 'rxjs/operators';

import { Dap } from '../../models/dap.model';
import { DapService } from '../../dap.service';
import { DapStatus } from '../../models/dap-status.enum';
import { DapStatusPipe } from '../../pipes/dap-status.pipe';
import { DapTypePipe } from '../../pipes/dap-type.pipe';
import { IdPadPipe } from '../../pipes/id-pad.pipe';
import { DetailComponent } from '../detail.component';

import { AuthService } from '@app/core/auth/services/auth.service';

@Component({
  selector: 'app-dap-dialog-details',
  standalone: true,
  imports: [
    CommonModule,
    NgClass,
    MatDialogModule,
    MatButtonModule,
    CurrencyPipe,
    DatePipe,
    PercentPipe,
    DapStatusPipe,
    DapTypePipe,
    IdPadPipe,
    DetailComponent,
  ],
  templateUrl: './dap-dialog-details.component.html',
})
export class DapDialogDetailsComponent {
  readonly DapStatus = DapStatus;

  isDownloadingSolicitud = false;
  isDownloadingInstructivo = false;

  isAdmin = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public currentDap: Dap,
    private dialogRef: MatDialogRef<DapDialogDetailsComponent>,
    private dapService: DapService,
    private authService: AuthService,
  ) {
    this.authService.currentUser$.pipe(take(1)).subscribe((u: any) => {
      if (!u) {
        this.isAdmin = false;
        return;
      }
      const role = (u as any).role ?? (u as any).roles ?? null;
      if (Array.isArray(role)) {
        this.isAdmin = role.includes('ADMIN') || role.includes('admin');
      } else {
        this.isAdmin = String(role).toUpperCase() === 'ADMIN';
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  descargarSolicitudPdf(): void {
    const run = this.dapService.getCurrentRun?.() ?? (this.currentDap as any).userRun;
    const dapId = this.currentDap.id;

    if (!run || !dapId) {
      alert(`Falta RUN o ID.\nrun=${run}\ndapId=${dapId}`);
      return;
    }

    if (this.isDownloadingSolicitud) return;
    this.isDownloadingSolicitud = true;

    this.dapService
      .downloadSolicitudPdf(Number(run), Number(dapId))
      .pipe(finalize(() => (this.isDownloadingSolicitud = false)))
      .subscribe({
        next: (blob: Blob) => this.saveBlob(blob, `Solicitud_DAP_${dapId}.pdf`),
        error: (err: unknown) => this.showHttpError('Solicitud', err),
      });
  }

  descargarInstructivoPdf(): void {
    const run = this.dapService.getCurrentRun?.() ?? (this.currentDap as any).userRun;
    const dapId = this.currentDap.id;

    if (!run || !dapId) {
      alert(`Falta RUN o ID.\nrun=${run}\ndapId=${dapId}`);
      return;
    }

    if (this.isDownloadingInstructivo) return;
    this.isDownloadingInstructivo = true;

    this.dapService
      .downloadInstructivoPdf(Number(run), Number(dapId))
      .pipe(finalize(() => (this.isDownloadingInstructivo = false)))
      .subscribe({
        next: (blob: Blob) => this.saveBlob(blob, `Instructivo_DAP_${dapId}.pdf`),
        error: (err: unknown) => this.showHttpError('Instructivo', err),
      });
  }

  // NEW: compute a sensible interest rate to display
  get displayInterest(): number | null {
    // prefer explicit interestRateInPeriod if present and non-zero
    const rawRate = Number((this.currentDap as any)?.interestRateInPeriod ?? (this.currentDap as any)?.interest_rate_in_period ?? NaN);
    if (!isNaN(rawRate) && rawRate !== 0) return rawRate;

    // fallback: try profit / initialAmount (period rate)
    const profit = Number((this.currentDap as any)?.profit ?? 0);
    const initial = Number((this.currentDap as any)?.initialAmount ?? (this.currentDap as any)?.initial_amount ?? 0);
    if (initial > 0 && !isNaN(profit) && profit !== 0) {
      // profit / initialAmount produces a decimal (e.g. 0.0038)
      return profit / initial;
    }

    return null;
  }

  private saveBlob(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  private showHttpError(label: string, err: unknown): void {
    if (err instanceof HttpErrorResponse) {
      console.error(`${label} download error`, err);
      alert(`${label} - Error: ${err.status} ${err.statusText}`);
    } else {
      console.error(`${label} download unknown error`, err);
      alert(`${label} - Error desconocido`);
    }
  }
}