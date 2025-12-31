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
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div>
          <h2 class="text-lg font-semibold text-[#7a2b00]">
            Adjuntos — Depósito #{{ dapId ? (dapId | number) : '' }}
          </h2>
          <div class="text-sm text-gray-500">Sube comprobantes y contratos asociados al DAP</div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="text-sm px-3 py-1 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
            (click)="close()"
          >
            Cerrar
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="p-4 space-y-4">
        <!-- Upload cards: responsive; columnas 1 en móvil, 2 en md -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Card: comprobante -->
          <div class="rounded-lg border border-[#ece6e1] bg-[#fbf8f6] p-4 flex flex-col md:flex-row items-start gap-3">
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-[#7a2b00] mb-2">Comprobante (JPG/PNG, ≤ 5MB)</div>

              <!-- Controls row: label (opens file picker) + filename -->
              <div class="flex items-center gap-3">
                <label
                  [attr.for]="'receipt-input-' + dapId"
                  class="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 cursor-pointer text-sm"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" class="inline-block" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 3v10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M8 7l4-4 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M21 21H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Seleccionar archivo
                </label>

                <input
                  id="{{'receipt-input-' + dapId}}"
                  type="file"
                  accept="image/jpeg,image/png"
                  (change)="onFileSelected($event, 'receipt')"
                  class="hidden"
                />

                <span class="text-sm text-gray-600 truncate max-w-[14rem]" *ngIf="selectedReceiptName">{{ selectedReceiptName }}</span>
                <span class="text-sm text-gray-400" *ngIf="!selectedReceiptName">Ningún archivo seleccionado</span>
              </div>
            </div>

            <!-- Upload button (separate, flex-none para no estirar layout) -->
            <div class="flex-none self-center md:self-stretch">
              <button
                class="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 text-sm"
                (click)="uploadSelected('receipt')"
                [disabled]="!selectedReceipt"
              >
                Subir comprobante
              </button>
            </div>
          </div>

          <!-- Card: signed document -->
          <div class="rounded-lg border border-[#ece6e1] bg-[#fbf8f6] p-4 flex flex-col md:flex-row items-start gap-3">
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-[#7a2b00] mb-2">Documento firmado (PDF, ≤ 10MB)</div>

              <div class="flex items-center gap-3">
                <label
                  [attr.for]="'signed-input-' + dapId"
                  class="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 cursor-pointer text-sm"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" class="inline-block" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 3v10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M8 7l4-4 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M21 21H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Seleccionar archivo
                </label>

                <input
                  id="{{'signed-input-' + dapId}}"
                  type="file"
                  accept="application/pdf"
                  (change)="onFileSelected($event, 'signed')"
                  class="hidden"
                />

                <span class="text-sm text-gray-600 truncate max-w-[14rem]" *ngIf="selectedSignedName">{{ selectedSignedName }}</span>
                <span class="text-sm text-gray-400" *ngIf="!selectedSignedName">Ningún archivo seleccionado</span>
              </div>
            </div>

            <div class="flex-none self-center md:self-stretch">
              <button
                class="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 text-sm"
                (click)="uploadSelected('signed')"
                [disabled]="!selectedSigned"
              >
                Subir documento firmado
              </button>
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
                <button
                  class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 text-sm"
                  (click)="downloadAttachment(a)"
                >
                  Descargar
                </button>

                <button
                  class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-200 bg-white text-red-600 hover:bg-red-50 text-sm"
                  (click)="deleteAttachment(a)"
                >
                  Borrar
                </button>
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
                <button
                  class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 text-sm"
                  (click)="downloadContract(c)"
                >
                  Descargar
                </button>
                <button
                  class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-200 bg-white text-red-600 hover:bg-red-50 text-sm"
                  (click)="deleteContract(c)"
                >
                  Borrar
                </button>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  `,
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

  private readonly MAX_RECEIPT = 5 * 1024 * 1024;
  private readonly MAX_SIGNED = 10 * 1024 * 1024;

  constructor(
    private dapService: DapService,
    @Optional() @Inject(MAT_DIALOG_DATA) private dialogData?: DapAttachmentsDialogData,
    @Optional() private dialogRef?: MatDialogRef<DapAttachmentsComponent>,
  ) {}

  ngOnInit(): void {
    console.log('DapAttachmentsComponent init', { dialogData: this.dialogData });
    if (this.dialogData) {
      this.userRun = this.dialogData.userRun ?? this.userRun;
      this.dapId = this.dialogData.dapId ?? this.dapId;
    }

    if (this.userRun && this.dapId) {
      this.loadAll();
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

    if (which === 'receipt') {
      if (!this.selectedReceipt) return;
      if (!['image/jpeg', 'image/png'].includes(this.selectedReceipt.type)) {
        this.message = 'Formato inválido para comprobante';
        return;
      }
      if (this.selectedReceipt.size > this.MAX_RECEIPT) {
        this.message = 'Comprobante supera 5MB';
        return;
      }

      if (!this.userRun || !this.dapId) {
        this.message = 'Usuario o DAP no definido';
        return;
      }

      this.dapService.uploadAttachment(this.userRun, this.dapId, this.selectedReceipt, 'receipt')
        .subscribe({
          next: (_v: DapAttachment) => {
            this.selectedReceipt = undefined;
            this.selectedReceiptName = undefined;
            this.loadAll();
          },
          error: (e) => (this.message = this.extractError(e)),
        });
    }

    if (which === 'signed') {
      if (!this.selectedSigned) return;
      if (this.selectedSigned.type !== 'application/pdf') {
        this.message = 'El documento debe ser PDF';
        return;
      }
      if (this.selectedSigned.size > this.MAX_SIGNED) {
        this.message = 'Documento supera 10MB';
        return;
      }

      if (!this.userRun || !this.dapId) {
        this.message = 'Usuario o DAP no definido';
        return;
      }

      this.dapService.uploadAttachment(this.userRun, this.dapId, this.selectedSigned, 'signed_document')
        .subscribe({
          next: (_v: DapAttachment) => {
            this.selectedSigned = undefined;
            this.selectedSignedName = undefined;
            this.loadAll();
          },
          error: (e) => (this.message = this.extractError(e)),
        });
    }
  }

  loadAll(): void {
    if (!this.userRun || !this.dapId) {
      this.attachments = [];
      this.contracts = [];
      return;
    }

    this.dapService.listAttachments(this.userRun, this.dapId)
      .subscribe({
        next: (a: DapAttachment[]) => (this.attachments = a || []),
        error: (e) => (this.message = this.extractError(e)),
      });

    this.dapService.listContracts(this.userRun, this.dapId)
      .subscribe({
        next: (c: DapContract[]) => (this.contracts = c || []),
        error: (e) => (this.message = this.extractError(e)),
      });
  }

  downloadAttachment(a: DapAttachment): void {
    if (!this.userRun || !this.dapId) return;
    this.dapService.downloadAttachment(this.userRun, this.dapId, a.id)
      .subscribe({
        next: (blob: Blob) => this.saveBlob(blob, a.filename),
        error: (e) => (this.message = this.extractError(e)),
      });
  }

  deleteAttachment(a: DapAttachment): void {
    if (!confirm('Eliminar adjunto?')) return;
    if (!this.userRun || !this.dapId) return;
    this.dapService.deleteAttachment(this.userRun, this.dapId, a.id)
      .subscribe({
        next: () => this.loadAll(),
        error: (e) => (this.message = this.extractError(e)),
      });
  }

  downloadContract(c: DapContract): void {
    if (!this.userRun || !this.dapId) return;
    this.dapService.downloadContract(this.userRun, this.dapId, c.id)
      .subscribe({
        next: (blob: Blob) => this.saveBlob(blob, c.filename),
        error: (e) => (this.message = this.extractError(e)),
      });
  }

  deleteContract(c: DapContract): void {
    if (!confirm('Eliminar contrato?')) return;
    if (!this.userRun || !this.dapId) return;
    this.dapService.deleteContract(this.userRun, this.dapId, c.id)
      .subscribe({
        next: () => this.loadAll(),
        error: (e) => (this.message = this.extractError(e)),
      });
  }

  close(): void {
    this.dialogRef?.close();
  }

  private saveBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'file';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  private extractError(e: any): string {
    try {
      if (e?.error) return typeof e.error === 'string' ? e.error : JSON.stringify(e.error);
      return e?.message || String(e);
    } catch {
      return 'Error desconocido';
    }
  }
}