import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { AdminHomeDapService, AdminHomeDapRow } from './admin-home-dap.service';
import { AdminBankAccountDialogComponent } from './admin-bank-account-dialog.component';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyPipe, DatePipe, MatDialogModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  loading = false;
  error = '';

  pendingWithAttachments: AdminHomeDapRow[] = [];
  expiredPending: AdminHomeDapRow[] = [];

  constructor(
    private adminHomeSvc: AdminHomeDapService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = '';

    this.adminHomeSvc.getHomeDaps().subscribe({
      next: (res) => {
        this.pendingWithAttachments = Array.isArray(res?.pendingWithAttachments)
          ? res.pendingWithAttachments
          : [];
        this.expiredPending = Array.isArray(res?.expiredPending) ? res.expiredPending : [];
        this.loading = false;
      },
      error: (err: any) => {
        console.error('admin home daps error', err);
        this.error = err?.error?.message ?? err?.message ?? 'No se pudo cargar el panel.';
        this.loading = false;
      },
    });
  }

  fullName(row: AdminHomeDapRow): string {
    const u = row?.user;
    if (!u) return '-';
    return [u.names, u.firstLastName, u.secondLastName].filter(Boolean).join(' ').trim() || '-';
  }

  openBankAccount(run: number) {
    const r = Number(run ?? 0);
    if (!r) return;
    this.dialog.open(AdminBankAccountDialogComponent, {
      width: '720px',
      maxWidth: '95vw',
      panelClass: 'dap-dialog',
      data: { run: r },
    });
  }

  trackById(_: number, item: AdminHomeDapRow) {
    return item?.id ?? _;
  }
}