import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';

import {
  BankAccountService,
  GetBankAccountResponse,
  UpsertBankAccountPayload,
} from '../../services/bank-account.service';

export interface DapCollectDialogData {
  run: number;
  dapId: number;
}

export type DapCollectDialogResult =
  | { action: 'close' }
  | { action: 'charge'; dapId: number };

@Component({
  selector: 'app-dap-collect-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './dap-collect-dialog.component.html',
  styleUrls: ['./dap-collect-dialog.component.scss'],
})
export class DapCollectDialogComponent implements OnInit {
  loading = false;
  saving = false;
  charging = false;
  error = '';
  success = '';

  clientName = '';
  run = 0;
  dapId = 0;

  hasAccount = false;
  isEditing = false;

  get canCharge(): boolean {
    return this.hasAccount && !this.isEditing && !this.loading && !this.saving && !this.charging;
  }

  form: UpsertBankAccountPayload = {
    rutOwner: '',
    bankCode: '',
    bankName: '',
    accountType: '',
    accountNumber: '',
    email: '',
  };

  constructor(
    private dialogRef: MatDialogRef<DapCollectDialogComponent, DapCollectDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: DapCollectDialogData,
    private bankAccountSvc: BankAccountService,
  ) {}

  ngOnInit(): void {
    this.run = Number(this.data?.run ?? 0);
    this.dapId = Number(this.data?.dapId ?? 0);
    this.load();
  }

  close() {
    this.dialogRef.close({ action: 'close' });
  }

  private showSuccess(msg: string) {
    this.success = msg;
    setTimeout(() => {
      if (this.success === msg) this.success = '';
    }, 2500);
  }

  load() {
    if (!this.run) {
      this.error = 'RUN inválido.';
      return;
    }

    this.loading = true;
    this.error = '';

    this.bankAccountSvc
      .get(this.run)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res: GetBankAccountResponse) => {
          this.clientName = res?.clientName ?? '';

          if (res?.bankAccount) {
            this.hasAccount = true;
            this.isEditing = false;
            this.form = {
              rutOwner: res.bankAccount.rutOwner ?? '',
              bankCode: res.bankAccount.bankCode ?? '',
              bankName: res.bankAccount.bankName ?? '',
              accountType: res.bankAccount.accountType ?? '',
              accountNumber: res.bankAccount.accountNumber ?? '',
              email: res.bankAccount.email ?? '',
            };
          } else {
            this.hasAccount = false;
            this.isEditing = true;
            this.form = {
              rutOwner: '',
              bankCode: '',
              bankName: '',
              accountType: '',
              accountNumber: '',
              email: '',
            };
          }
        },
        error: (err: any) => {
          console.error('GET bank-account error', err);
          this.error =
            err?.error?.message ?? err?.message ?? 'No se pudo cargar la cuenta bancaria.';
        },
      });
  }

  startEdit() {
    if (this.loading || this.saving || this.charging) return;
    this.error = '';
    this.success = '';
    this.isEditing = true;
  }

  cancelEdit() {
    this.error = '';
    this.success = '';
    this.load();
  }

  save() {
    if (!this.run) return;

    this.saving = true;
    this.error = '';
    this.success = '';

    this.bankAccountSvc
      .upsert(this.run, this.form)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.showSuccess('Cuenta editada correctamente');
          this.isEditing = false;
          this.hasAccount = true;
          this.load();
        },
        error: (err: any) => {
          console.error('PUT bank-account error', err);
          this.error =
            err?.error?.message ?? err?.message ?? 'No se pudo guardar la cuenta bancaria.';
        },
      });
  }

  charge() {
    if (!this.canCharge) return;
    this.dialogRef.close({ action: 'charge', dapId: this.dapId });
  }
}