import { CurrencyPipe, DatePipe, NgClass, PercentPipe } from '@angular/common';
import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { Dap } from '../../models/dap.model';
import { DapService } from '../../dap.service';
import { DapStatus } from '../../models/dap-status.enum';
import { DapStatusPipe } from '../../pipes/dap-status.pipe';
import { DapTypePipe } from '../../pipes/dap-type.pipe';
import { IdPadPipe } from '../../pipes/id-pad.pipe';
import { DetailComponent } from '../detail.component';

@Component({
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
  // ✅ para usar en el HTML sin comparar strings
  readonly DapStatus = DapStatus;

  isDownloadingSolicitud = false;
  isDownloadingInstructivo = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public currentDap: Dap,
    private dialogRef: MatDialogRef<DapDialogDetailsComponent>,
    private dapService: DapService,
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  descargarSolicitudPdf(): void {
    if (!this.currentDap?.id) return;

    this.isDownloadingSolicitud = true;
    this.dapService
      .downloadSolicitudPdf(this.currentDap.id, this.currentDap.userRun)
      .subscribe({
        next: (blob) => {
          this.saveBlob(blob, `Solicitud_DAP_${this.currentDap.id}.pdf`);
          this.isDownloadingSolicitud = false;
        },
        error: (err) => {
          console.error(err);
          this.isDownloadingSolicitud = false;
          alert('No se pudo descargar la Solicitud (PDF).');
        },
      });
  }

  descargarInstructivoPdf(): void {
    if (!this.currentDap?.userRun) return;

    this.isDownloadingInstructivo = true;
    this.dapService.downloadInstructivoPdf(this.currentDap.userRun).subscribe({
      next: (blob) => {
        this.saveBlob(blob, `Instructivo_Deposito_DAP.pdf`);
        this.isDownloadingInstructivo = false;
      },
      error: (err) => {
        console.error(err);
        this.isDownloadingInstructivo = false;
        alert('No se pudo descargar el Instructivo (PDF).');
      },
    });
  }

  private saveBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
