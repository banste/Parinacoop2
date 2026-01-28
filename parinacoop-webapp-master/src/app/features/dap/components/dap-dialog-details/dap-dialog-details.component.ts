import { CommonModule, CurrencyPipe, DatePipe, NgClass, PercentPipe } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
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

// Auth
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
export class DapDialogDetailsComponent implements OnInit {
  readonly DapStatus = DapStatus;

  isDownloadingSolicitud = false;
  isDownloadingInstructivo = false;

  isAdmin = false;

  // loading single DAP details (internal id)
  loadingDetails = false;
  detailsError: string | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public currentDap: Dap,
    private dialogRef: MatDialogRef<DapDialogDetailsComponent>,
    private dapService: DapService,
    private authService: AuthService,
  ) {
    // determinar rol admin
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

  ngOnInit(): void {
    // Intentamos cargar el DAP completo al abrir el diálogo para obtener campos adicionales
    // (por ejemplo internal_id) si el endpoint de listado no los devuelve.
    this.loadFullDapIfNeeded();
  }

  private loadFullDapIfNeeded() {
    // Si ya tenemos internalId, no hacemos petición adicional
    const existing = (this.currentDap as any).internalId ?? (this.currentDap as any).internal_id;
    if (existing) return;

    const dapId = Number(this.currentDap?.id ?? 0);
    // resolver run: preferimos userRun que viene con el DAP, si no usamos el service currentRun
    const runFromDap = Number((this.currentDap as any)?.userRun ?? this.dapService.getCurrentRun?.());
    if (!dapId || isNaN(dapId) || !runFromDap || isNaN(runFromDap)) {
      // no tenemos datos suficientes para pedir el DAP individual
      return;
    }

    this.loadingDetails = true;
    this.detailsError = null;

    this.dapService
      .getDap(runFromDap, dapId)
      .pipe(finalize(() => (this.loadingDetails = false)))
      .subscribe({
        next: (res: any) => {
          // El endpoint puede devolver la entidad con distintos nombres de campos.
          // Solo actualizamos internalId (no sobrescribimos currentDap completo para evitar efectos colaterales).
          const internal =
            res?.internal_id ??
            res?.internalId ??
            res?.dap_internal_id ??
            res?.internal_id_value ??
            null;

          if (internal) {
            (this.currentDap as any).internalId = internal;
          } else {
            // Si el backend devuelve la relación en otra ruta (ej. internal ids), puedes adaptarlo aquí.
            (this.currentDap as any).internalId = (this.currentDap as any).internalId ?? null;
          }
        },
        error: (err: any) => {
          console.warn('getDap failed for details', err);
          this.detailsError = err?.message ?? 'Error al cargar detalles del DAP';
        },
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

  // helpers
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

  // getter usado en plantilla (ya existía en tu componente anterior)
  get displayInterest(): number | null {
    const rawRate = Number((this.currentDap as any)?.interestRateInPeriod ?? (this.currentDap as any)?.interest_rate_in_period ?? NaN);
    if (!isNaN(rawRate) && rawRate !== 0) return rawRate;

    const profit = Number((this.currentDap as any)?.profit ?? 0);
    const initial = Number((this.currentDap as any)?.initialAmount ?? (this.currentDap as any)?.initial_amount ?? 0);
    if (initial > 0 && !isNaN(profit) && profit !== 0) {
      return profit / initial;
    }
    return null;
  }
}