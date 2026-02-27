import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { AdminHomeDapService, AdminGetBankAccountResponse } from './admin-home-dap.service';

export type AdminBankAccountDialogData = { run: number };

@Component({
  selector: 'app-admin-bank-account-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './admin-bank-account-dialog.component.html',
  styleUrls: ['./admin-bank-account-dialog.component.scss'],
})
export class AdminBankAccountDialogComponent implements OnInit {
  loading = false;
  error = '';
  res: AdminGetBankAccountResponse | null = null;

  constructor(
    private dialogRef: MatDialogRef<AdminBankAccountDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AdminBankAccountDialogData,
    private homeSvc: AdminHomeDapService,
  ) {}

  ngOnInit(): void {
    const run = Number(this.data?.run ?? 0);
    if (!run) {
      this.error = 'RUN inválido';
      return;
    }
    this.loading = true;
    this.homeSvc.getBankAccount(run).subscribe({
      next: (r) => {
        this.res = r;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('getBankAccount error', err);
        this.error = err?.error?.message ?? err?.message ?? 'No se pudo cargar cuenta bancaria';
        this.loading = false;
      },
    });
  }

  close() {
    this.dialogRef.close();
  }
}