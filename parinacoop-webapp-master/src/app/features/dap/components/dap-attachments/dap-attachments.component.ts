import { Component, Input, OnChanges, OnInit, SimpleChanges, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DapService, DapAttachment, DapContract } from '../../dap.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DapAttachmentsDialogData {
  dapId: number;
  userRun: number | null;
}

@Component({
  selector: 'app-dap-attachments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="box-border w-full">
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div>
          <h2 class="text-lg font-semibold text-[#7a2b00]">Adjuntos — Depósito #{{ dapId ? (dapId | number) : '' }}</h2>
          <div class="text-sm text-gray-500">Sube comprobantes y contratos asociados al DAP</div>
        </div>

        <div>
          <button type="button" class="text-sm px-3 py-1 rounded-full bg-blue-50 text-blue-600" (click)="close()">Cerrar</button>
        </div>
      </div>

      <div class="p-4 space-y-4">
        <!-- Servidor-level lock: si backend devuelve attachments_locked = true,
             mostramos aviso global y deshabilitamos todo -->
        <div *ngIf="attachmentsLocked" class="text-sm text-gray-600 bg-yellow-50 border border-yellow-100 p-3 rounded">
          Ya existen adjuntos para este depósito o las subidas están bloqueadas por el sistema. No se permiten nuevas subidas. Puedes descargar o borrar los archivos existentes.
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Comprobante -->
          <div class="card-upload">
            <div class="card-body">
              <div class="text-sm font-medium text-[#7a2b00] mb-2">Comprobante (JPG/PNG, ≤ 5MB)</div>

              <div class="flex items-center gap-3">
                <label [attr.for]="'receipt-file-' + dapId"
                       class="btn-file inline-flex items-center gap-2 px-3 py-2 rounded-full border border-blue-200 bg-white text-blue-600 cursor-pointer"
                       [class.opacity-50]="attachmentsLocked || receiptUploaded"
                       [attr.aria-disabled]="(attachmentsLocked || receiptUploaded) ? true : null">
                  Seleccionar archivo
                </label>

                <input id="{{'receipt-file-' + dapId}}"
                       type="file"
                       accept="image/jpeg,image/png"
                       (change)="onFileSelected($event, 'receipt')"
                       style="display: none;"
                       [disabled]="attachmentsLocked || receiptUploaded" />

                <span class="text-sm text-gray-600 truncate max-w-[14rem]" *ngIf="selectedReceiptName">{{ selectedReceiptName }}</span>
                <span class="text-sm text-gray-400" *ngIf="!selectedReceiptName">Ningún archivo seleccionado</span>
              </div>

              <div class="card-actions mt-3">
                <button (click)="uploadSelected('receipt')"
                        [disabled]="attachmentsLocked || receiptUploaded || !selectedReceipt"
                        class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 text-sm">
                  Subir comprobante
                </button>
                <div *ngIf="receiptUploaded && !attachmentsLocked" class="text-xs text-green-600 ml-3">Comprobante subido</div>
              </div>
            </div>
          </div>

          <!-- Documento firmado -->
          <div class="card-upload">
            <div class="card-body">
              <div class="text-sm font-medium text-[#7a2b00] mb-2">Documento firmado (PDF, ≤ 10MB)</div>

              <div class="flex items-center gap-3">
                <label [attr.for]="'signed-file-' + dapId"
                       class="btn-file inline-flex items-center gap-2 px-3 py-2 rounded-full border border-blue-200 bg-white text-blue-600 cursor-pointer"
                       [class.opacity-50]="attachmentsLocked || signedUploaded"
                       [attr.aria-disabled]="(attachmentsLocked || signedUploaded) ? true : null">
                  Seleccionar archivo
                </label>

                <input id="{{'signed-file-' + dapId}}"
                       type="file"
                       accept="application/pdf"
                       (change)="onFileSelected($event, 'signed')"
                       style="display: none;"
                       [disabled]="attachmentsLocked || signedUploaded" />

                <span class="text-sm text-gray-600 truncate max-w-[14rem]" *ngIf="selectedSignedName">{{ selectedSignedName }}</span>
                <span class="text-sm text-gray-400" *ngIf="!selectedSignedName">Ningún archivo seleccionado</span>
              </div>

              <div class="card-actions mt-3">
                <button (click)="uploadSelected('signed')"
                        [disabled]="attachmentsLocked || signedUploaded || !selectedSigned"
                        class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 text-sm">
                  Subir documento
                </button>
                <div *ngIf="signedUploaded && !attachmentsLocked" class="text-xs text-green-600 ml-3">Documento subido</div>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="message" class="text-sm text-red-600">{{ message }}</div>

        <div *ngIf="attachments?.length" class="rounded-lg border border-[#ece6e1] bg-white p-3">
          <h4 class="text-sm font-semibold mb-2">Adjuntos</h4>
          <ul class="space-y-2">
            <li *ngFor="let a of attachments" class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <span class="text-sm truncate">{{ a.filename }}</span>
                <span class="text-xs text-gray-400">({{ a.type }})</span>
                <span class="text-xs text-gray-400">· {{ a.created_at ? (a.created_at | date:'short') : '' }}</span>
              </div>

              <div class="flex items-center gap-2 flex-none">
                <button (click)="downloadAttachment(a)" class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 text-sm">Descargar</button>
                <button (click)="deleteAttachment(a)" class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-200 bg-white text-red-600 hover:bg-red-50 text-sm">Borrar</button>
              </div>
            </li>
          </ul>
        </div>

        <div *ngIf="contracts?.length" class="rounded-lg border border-[#ece6e1] bg-white p-3">
          <h4 class="text-sm font-semibold mb-2">Contratos</h4>
          <ul class="space-y-2">
            <li *ngFor="let c of contracts" class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <span class="text-sm truncate">{{ c.filename }}</span>
                <span class="text-xs text-gray-400">· {{ c.created_at ? (c.created_at | date:'short') : '' }}</span>
              </div>

              <div class="flex items-center gap-2 flex-none">
                <button (click)="downloadContract(c)" class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 text-sm">Descargar</button>
                <button (click)="deleteContract(c)" class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-200 bg-white text-red-600 hover:bg-red-50 text-sm">Borrar</button>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .btn-file { user-select: none; }
    .card-upload { border-radius: .5rem; border: 1px solid #efe6e1; background: #fbf8f6; padding: 1rem; display:flex; flex-direction:column; justify-content:space-between; min-height:120px; }
    .card-body { flex:1; }
    .card-actions { margin-top: .5rem; display:flex; justify-content:flex-end; align-items:center; }
    .opacity-50 { opacity: .5; pointer-events: none; }
  `]
})
export class DapAttachmentsComponent implements OnInit, OnChanges {
  @Input() userRun!: number | null;
  @Input() dapId!: number | null;

  selectedReceipt?: File;
  selectedSigned?: File;
  selectedReceiptName?: string;
  selectedSignedName?: string;

  attachments: DapAttachment[] = [];
  contracts: DapContract[] = [];
  message = '';

  // server-level lock (if backend exposes it)
  attachmentsLocked = false;

  // per-type flags (we disable only the uploaded type)
  receiptUploaded = false;
  signedUploaded = false;

  private readonly MAX_RECEIPT = 5 * 1024 * 1024;
  private readonly MAX_SIGNED = 10 * 1024 * 1024;

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
          // If backend indicates a global lock, also mark both types as uploaded (UI should disable both)
          if (this.attachmentsLocked) {
            this.receiptUploaded = true;
            this.signedUploaded = true;
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

  onFileSelected(event: Event, which: 'receipt' | 'signed'): void {
    const input = event.target as HTMLInputElement;
    const f = input.files && input.files[0];
    if (!f) return;
    if (which === 'receipt') {
      this.selectedReceipt = f;
      this.selectedReceiptName = f.name;
    } else {
      this.selectedSigned = f;
      this.selectedSignedName = f.name;
    }
  }

  uploadSelected(which: 'receipt' | 'signed'): void {
    this.message = '';
    if (this.attachmentsLocked) { this.message = 'No se pueden subir más archivos para este depósito'; return; }

    if (which === 'receipt') {
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
          // mark only receipt as uploaded
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
            this.signedUploaded = true;
            this.message = 'No se pueden subir más archivos para este depósito';
          } else {
            this.message = this.extractError(e);
          }
        },
      });
    } else {
      if (!this.selectedSigned) { this.message = 'Seleccione un archivo'; return; }
      if (this.selectedSigned.type !== 'application/pdf') { this.message = 'El documento debe ser PDF'; return; }
      if (this.selectedSigned.size > this.MAX_SIGNED) { this.message = 'El documento excede 10MB'; return; }
      if (!this.userRun || !this.dapId) { this.message = 'Usuario o DAP no definido'; return; }

      this.message = 'Subiendo...';
      this.dapService.uploadAttachment(this.userRun, this.dapId, this.selectedSigned, 'signed_document').subscribe({
        next: (res: any) => {
          console.debug('uploadAttachment success:', res);
          this.selectedSigned = undefined;
          this.selectedSignedName = undefined;
          // mark only signed as uploaded
          this.signedUploaded = true;
          this.message = 'Documento subido correctamente';
          this.loadAll();
        },
        error: (e: any) => {
          console.error('uploadAttachment error:', e);
          if (e?.status === 409) {
            this.attachmentsLocked = true;
            this.receiptUploaded = true;
            this.signedUploaded = true;
            this.message = 'No se pueden subir más archivos para este depósito';
          } else {
            this.message = this.extractError(e);
          }
        },
      });
    }
  }

  loadAll(): void {
    if (!this.userRun || !this.dapId) { this.attachments = []; this.contracts = []; this.receiptUploaded = false; this.signedUploaded = false; return; }

    this.dapService.listAttachments(this.userRun, this.dapId).subscribe({
      next: (a: DapAttachment[]) => {
        this.attachments = a || [];

        // Recalculate per-type flags from attachments list (tolerant detection)
        const receiptExists = (this.attachments ?? []).some(x => this.isReceiptType(x.type));
        const signedExists = (this.attachments ?? []).some(x => this.isSignedType(x.type));

        // If server-level lock already true we keep both disabled
        if (!this.attachmentsLocked) {
          this.receiptUploaded = receiptExists;
          this.signedUploaded = signedExists;
        }
      },
      error: (e: any) => this.message = this.extractError(e),
    });

    this.dapService.listContracts(this.userRun, this.dapId).subscribe({
      next: (c: DapContract[]) => this.contracts = c || [],
      error: () => {},
    });
  }

  // Helpers to detect type (tolerant with different strings)
  private isReceiptType(type: string | undefined | null): boolean {
    const s = (type ?? '').toString().toLowerCase();
    return s.includes('receipt') || s.includes('comprobante') || s.includes('jpg') || s.includes('png') || s.includes('image');
  }
  private isSignedType(type: string | undefined | null): boolean {
    const s = (type ?? '').toString().toLowerCase();
    return s.includes('signed') || s.includes('document') || s.includes('pdf') || s.includes('contrato') || s.includes('contract');
  }

  downloadAttachment(a: DapAttachment): void {
    if (!this.userRun || !this.dapId) return;
    this.dapService.downloadAttachment(this.userRun, this.dapId, a.id).subscribe({
      next: (b: Blob) => this.saveBlob(b, a.filename),
      error: (e: any) => this.message = this.extractError(e),
    });
  }

  deleteAttachment(a: DapAttachment): void {
    if (!confirm('Eliminar adjunto?')) return;
    if (!this.userRun || !this.dapId) return;
    this.dapService.deleteAttachment(this.userRun, this.dapId, a.id).subscribe({
      next: () => {
        this.message = 'Adjunto eliminado';
        this.loadAll();
        setTimeout(() => {
          // recompute flags from attachments after loadAll
          this.receiptUploaded = (this.attachments ?? []).some(x => this.isReceiptType(x.type));
          this.signedUploaded = (this.attachments ?? []).some(x => this.isSignedType(x.type));
        }, 200);
      },
      error: (e: any) => this.message = this.extractError(e),
    });
  }

  downloadContract(c: DapContract): void {
    if (!this.userRun || !this.dapId) return;
    this.dapService.downloadContract(this.userRun, this.dapId, c.id).subscribe({
      next: (b: Blob) => this.saveBlob(b, c.filename),
      error: (e: any) => this.message = this.extractError(e),
    });
  }

  deleteContract(c: DapContract): void {
    if (!confirm('Eliminar contrato?')) return;
    if (!this.userRun || !this.dapId) return;
    this.dapService.deleteContract(this.userRun, this.dapId, c.id).subscribe({
      next: () => this.loadAll(),
      error: (e: any) => this.message = this.extractError(e),
    });
  }

  close(): void { this.dialogRef?.close(); }

  private saveBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename || 'file'; document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
  }

  private extractError(e: any): string {
    try { if (e?.error) return typeof e.error === 'string' ? e.error : JSON.stringify(e.error); return e?.message || String(e); } catch { return 'Error desconocido'; }
  }
}