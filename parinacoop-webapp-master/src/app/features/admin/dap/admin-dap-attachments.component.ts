import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AdminDapService } from './admin-dap.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-admin-dap-attachments',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './admin-dap-attachments.component.html',
  styleUrls: ['./admin-dap-attachments.component.scss'],
})
export class AdminDapAttachmentsComponent implements OnInit, OnDestroy {
  attachments: any[] = [];
  loading = false;
  errorMessage = '';

  // preview state
  isPreviewing = false;
  previewUrl: SafeResourceUrl | null = null;
  previewMime: string | null = null;
  previewFilename: string | null = null;
  private currentObjectUrl: string | null = null;
  private downloadingPreview = false;

  constructor(
    private dialogRef: MatDialogRef<AdminDapAttachmentsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { run: number; dapId: number },
    private adminDapService: AdminDapService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.revokeCurrentUrl();
  }

  close() {
    this.dialogRef.close();
  }

  load() {
    if (!this.data || !this.data.run || !this.data.dapId) {
      this.errorMessage = 'Parámetros inválidos.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.adminDapService.listAttachmentsAdmin(this.data.run, this.data.dapId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (rows) => {
          this.attachments = Array.isArray(rows) ? rows : [];
        },
        error: (err: any) => {
          if (err?.status === 403) {
            this.errorMessage = 'No estás autorizado para ver los adjuntos de este cliente.';
          } else {
            this.errorMessage = 'Error al cargar adjuntos. Revisa la consola para más detalles.';
            console.error('listAttachmentsAdmin error', err);
          }
        },
      });
  }

  download(attachmentId: number) {
    if (!this.data?.run || !this.data?.dapId) {
      alert('Parámetros inválidos para descarga.');
      return;
    }

    this.adminDapService
      .downloadAttachmentAdmin(this.data.run, this.data.dapId, attachmentId)
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `attachment_${attachmentId}`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        },
        error: (err: any) => {
          console.error('downloadAttachmentAdmin error', err);
          const msg = err?.error?.message ?? err?.message ?? 'Error descargando adjunto';
          alert(msg);
        },
      });
  }

  /**
   * Preview in-dialog: fetches blob and shows it if the browser supports the mime type.
   * Supports image/* and application/pdf. For others we show a notice and keep download button.
   */
  preview(attachment: any) {
    if (!this.data?.run || !this.data?.dapId) {
      alert('Parámetros inválidos para vista previa.');
      return;
    }
    if (this.downloadingPreview) return; // simple guard
    this.downloadingPreview = true;
    this.revokeCurrentUrl();
    this.isPreviewing = false;
    this.previewUrl = null;
    this.previewMime = null;
    this.previewFilename = attachment?.filename ?? null;

    this.adminDapService
      .downloadAttachmentAdmin(this.data.run, this.data.dapId, attachment.id)
      .pipe(finalize(() => (this.downloadingPreview = false)))
      .subscribe({
        next: (blob: Blob) => {
          // determine mime: prefer attachment.mime_type if available, else blob.type
          const mime = (attachment?.mime_type ?? blob.type ?? '').toLowerCase();
          this.previewMime = mime || null;

          // create object URL and sanitize
          const objUrl = window.URL.createObjectURL(blob);
          this.currentObjectUrl = objUrl;
          this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(objUrl);
          this.isPreviewing = true;
        },
        error: (err: any) => {
          console.error('preview download error', err);
          const msg = err?.error?.message ?? err?.message ?? 'Error obteniendo archivo para vista previa';
          this.errorMessage = msg;
        },
      });
  }

  closePreview() {
    this.isPreviewing = false;
    this.previewUrl = null;
    this.previewMime = null;
    this.previewFilename = null;
    this.revokeCurrentUrl();
  }

  // helper to avoid leaking object URLs
  private revokeCurrentUrl() {
    if (this.currentObjectUrl) {
      try {
        window.URL.revokeObjectURL(this.currentObjectUrl);
      } catch {}
      this.currentObjectUrl = null;
    }
  }

  // convenience checks for template
  isImage(): boolean {
    return !!this.previewMime && this.previewMime.startsWith('image/');
  }
  isPdf(): boolean {
    return !!this.previewMime && (this.previewMime === 'application/pdf' || this.previewMime.endsWith('/pdf'));
  }
}