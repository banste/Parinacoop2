import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { DapService } from '../../dap.service';
import { finalize } from 'rxjs';

export interface PreviewData {
  userRun: number;
  dapId: number;
}

@Component({
  selector: 'app-dap-instructivo-preview',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './dap-instructivo-preview.component.html',
  styleUrls: ['./dap-instructivo-preview.component.scss'],
})
export class DapInstructivoPreviewComponent implements OnInit {
  instructions: any | null = null;
  loadingInstructions = false;
  downloading = false;
  error = '';

  constructor(
    private dialogRef: MatDialogRef<DapInstructivoPreviewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PreviewData,
    private svc: DapService,
  ) {}

  ngOnInit(): void {
    this.loadInstructions();
  }

  loadInstructions() {
    this.loadingInstructions = true;
    this.error = '';
    this.svc.getInstructions().pipe(finalize(() => (this.loadingInstructions = false))).subscribe({
      next: (r) => (this.instructions = r),
      error: (err: any) => {
        console.error('Error loading instructions', err);
        if (err?.status === 404) {
          this.error = 'No hay configuración de instructivo en la base de datos.';
        } else {
          this.error = err?.error?.message ?? err?.message ?? 'No se pudo cargar la vista previa de instrucciones.';
        }
      },
    });
  }

  // Descarga el PDF (sin previsualizarlo)
  downloadPdf() {
    if (!this.data?.userRun || !this.data?.dapId) {
      this.error = 'Faltan datos del DAP para generar el PDF.';
      return;
    }

    if (this.downloading) return;
    this.downloading = true;
    this.error = '';

    this.svc
      .downloadInstructivoPdf(this.data.userRun, this.data.dapId)
      .pipe(finalize(() => (this.downloading = false)))
      .subscribe({
        next: (blob: Blob) => {
          const fileName = `Instructivo_DAP_${this.data.dapId}.pdf`;
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          try {
            window.URL.revokeObjectURL(url);
          } catch (e) {
            // ignore
          }
        },
        error: (err: any) => {
          console.error('Error downloading PDF', err);
          if (err?.status === 401 || err?.status === 403) {
            this.error = 'No autorizado para descargar el PDF de este DAP.';
          } else if (err?.status === 404) {
            this.error = 'No se encontró el DAP o la configuración para generar el instructivo.';
          } else {
            this.error = err?.error?.message ?? err?.message ?? 'No se pudo descargar el PDF del instructivo.';
          }
        },
      });
  }

  close() {
    this.dialogRef.close();
  }
}