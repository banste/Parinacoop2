import { CurrencyPipe, DatePipe, NgClass, PercentPipe } from '@angular/common';
import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

import { Dap } from '../../models/dap.model';
import { DapService } from '../../dap.service';
import { DapStatus } from '../../models/dap-status.enum';
import { DapStatusPipe } from '../../pipes/dap-status.pipe';
import { DapTypePipe } from '../../pipes/dap-type.pipe';
import { IdPadPipe } from '../../pipes/id-pad.pipe';
import { DetailComponent } from '../detail.component';

@Component({
  selector: 'app-dap-dialog-details',
  standalone: true,
  imports: [
    NgClass,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
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

  constructor(
    @Inject(MAT_DIALOG_DATA) public currentDap: Dap,
    private dialogRef: MatDialogRef<DapDialogDetailsComponent>,
    private dapService: DapService
  ) {}

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