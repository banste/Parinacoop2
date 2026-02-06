import { Component, Input, OnChanges, OnInit, SimpleChanges, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DapService, DapAttachment } from '../../dap.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DapAttachmentsDialogData {
  dapId: number;
  userRun: number | null;
}

@Component({
  selector: 'app-dap-attachments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dap-attachments.component.html',
  styleUrls: ['./dap-attachments.component.scss'],
})
export class DapAttachmentsComponent implements OnInit, OnChanges {
  @Input() userRun!: number | null;
  @Input() dapId!: number | null;

  // Only receipt related fields (we removed signed document handling)
  selectedReceipt?: File;
  selectedReceiptName?: string;

  attachments: DapAttachment[] = [];
  message = '';

  // server-level lock (if backend exposes it)
  attachmentsLocked = false;

  // per-type flag (we disable only the uploaded receipt)
  receiptUploaded = false;

  private readonly MAX_RECEIPT = 5 * 1024 * 1024;

  constructor(
    private dapService: DapService,
    @Optional() @Inject(MAT_DIALOG_DATA) private dialogData?: DapAttachmentsDialogData,
    @Optional() private dialogRef?: MatDialogRef<DapAttachmentsComponent>,
  ) {}

  ngOnInit(): void {
    if (this.dialogData) {
      this.userRun = this.dialogData.userRun ?? this.userRun;
      this.dapId = this.dialogData.dapId ?? this.dapId;
    }

    if (this.userRun && this.dapId) {
      this.loadAll();
      // Check server-level lock flag if backend provides it
      this.dapService.getDap(this.userRun, this.dapId).subscribe({
        next: (d: any) => {
          this.attachmentsLocked = !!(d?.attachments_locked ?? d?.attachmentsLocked ?? false);
          if (this.attachmentsLocked) {
            this.receiptUploaded = true;
          }
        },
        error: () => {
          // ignore errors here; we'll fallback to attachments presence
        },
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['userRun'] || changes['dapId']) && this.userRun && this.dapId) {
      this.loadAll();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const f = input.files && input.files[0];
    if (!f) return;
    this.selectedReceipt = f;
    this.selectedReceiptName = f.name;
  }

  uploadSelected(): void {
    this.message = '';
    if (this.attachmentsLocked) { this.message = 'No se pueden subir más archivos para este depósito'; return; }

    if (!this.selectedReceipt) { this.message = 'Seleccione un archivo'; return; }
    if (!['image/jpeg','image/png'].includes(this.selectedReceipt.type)) { this.message = 'Formato inválido'; return; }
    if (this.selectedReceipt.size > this.MAX_RECEIPT) { this.message = 'El comprobante excede 5MB'; return; }
    if (!this.userRun || !this.dapId) { this.message = 'Usuario o DAP no definido'; return; }

    this.message = 'Subiendo...';
    this.dapService.uploadAttachment(this.userRun, this.dapId, this.selectedReceipt, 'receipt').subscribe({
      next: (res: any) => {
        console.debug('uploadAttachment success:', res);
        this.selectedReceipt = undefined;
        this.selectedReceiptName = undefined;
        // mark receipt as uploaded
        this.receiptUploaded = true;
        this.message = 'Archivo subido correctamente';
        this.loadAll();
      },
      error: (e: any) => {
        console.error('uploadAttachment error:', e);
        if (e?.status === 409) {
          // server conflict: assume global lock
          this.attachmentsLocked = true;
          this.receiptUploaded = true;
          this.message = 'No se pueden subir más archivos para este depósito';
        } else {
          this.message = this.extractError(e);
        }
      },
    });
  }

  loadAll(): void {
    if (!this.userRun || !this.dapId) { this.attachments = []; this.receiptUploaded = false; return; }

    this.dapService.listAttachments(this.userRun, this.dapId).subscribe({
      next: (rows: any[]) => {
        this.attachments = Array.isArray(rows) ? rows : [];
        // If there's any receipt type attachment mark receiptUploaded so UI disables further receipts
        this.receiptUploaded = this.attachments.some(a => {
          // usamos `any` para evitar errores de typing en propiedades que pueden venir de distintas fuentes
          const t = String((a as any).type ?? (a as any).mime_type ?? '').toLowerCase();
          const filename = String(a.filename ?? '').toLowerCase();
          return t.includes('receipt') || t === 'receipt' || t.includes('comprobante') || /\.png|\.jpg|\.jpeg/.test(filename);
        });
      },
      error: (err: any) => {
        console.error('listAttachments error', err);
        this.attachments = [];
      },
    });
  }

  download(attachmentId: number) {
    if (!this.userRun || !this.dapId) {
      alert('Parámetros inválidos para descarga.');
      return;
    }

    this.dapService.downloadAttachment(this.userRun, this.dapId, attachmentId).subscribe({
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
        console.error('downloadAttachment error', err);
        const msg = err?.error?.message ?? err?.message ?? 'Error descargando adjunto';
        alert(msg);
      },
    });
  }

  close(): void {
    if (this.dialogRef) this.dialogRef.close();
  }

  private extractError(e: any): string {
    if (!e) return 'Error desconocido';
    if (typeof e === 'string') return e;
    if (e?.error?.message) return e.error.message;
    if (e?.message) return e.message;
    return 'Error desconocido';
  }
}