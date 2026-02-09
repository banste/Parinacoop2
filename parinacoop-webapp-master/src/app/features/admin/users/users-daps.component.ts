import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';

import { AdminUsersService } from './admin-users.service';
import { AdminDapService } from '../dap/admin-dap.service';
import { DapDialogDetailsComponent } from '@app/features/dap/components/dap-dialog-details/dap-dialog-details.component';
import { AdminDapAttachmentsComponent } from '../dap/admin-dap-attachments.component';
import { Dap } from '@app/features/dap/models/dap.model';

@Component({
  selector: 'app-admin-users-daps',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatDialogModule,
    AsyncPipe,
    FormsModule,
    DapDialogDetailsComponent,
    AdminDapAttachmentsComponent,
  ],
  templateUrl: './users-daps.component.html',
  styleUrls: ['./users-daps.component.scss'],
})
export default class UsersDapsComponent implements OnInit, OnDestroy {
  userName: string | null = null;
  userRun: string | null = null;
  daps$?: Observable<Dap[] | null>;

  loadingUser = false;
  errorMessage: string | null = null;

  // activation UI state
  isActivatingMap: Record<number, boolean> = {};
  activationMsgMap: Record<number, string | null> = {};
  activationErrMap: Record<number, string | null> = {};

  // status editor
  statuses = [
    { value: 'PENDING', label: 'PENDIENTE' },
    { value: 'ACTIVE', label: 'ACTIVO' },
    { value: 'CANCELLED', label: 'CANCELADO' },
    { value: 'ANNULLED', label: 'ANULADO' },
  ];
  // keep undefined allowed so template accepts ngModel
  selectedStatus: Record<number, string | undefined> = {};
  savingStatus: Record<number, boolean | undefined> = {};

  private subs: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private adminUsersSvc: AdminUsersService,
    private adminDapService: AdminDapService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.daps$ = this.adminDapService.daps$;

    // Initialize selectedStatus from incoming DAPs, normalizing names
    const sInit = this.daps$?.subscribe((list) => {
      const arr = Array.isArray(list) ? list : [];
      for (const d of arr) {
        const id = this.getDapId(d);
        if (!id) continue;
        // normalize status to canonical values
        const raw = (d as any)?.status ?? (d as any)?.estado ?? '';
        const normalized = this.normalizeStatus(raw);
        // only set if not already set (keeps user's edits)
        if (!this.selectedStatus[id]) this.selectedStatus[id] = normalized;
      }
    });
    if (sInit) this.subs.push(sInit);

    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.errorMessage = 'ID de usuario inválido en la ruta.';
      return;
    }
    const id = Number(idParam);
    if (isNaN(id) || id <= 0) {
      this.errorMessage = 'ID de usuario inválido.';
      return;
    }

    this.loadUserAndDaps(id);
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.subs = [];
  }

  private loadUserAndDaps(id: number): void {
    this.loadingUser = true;
    this.errorMessage = null;

    const sub = this.adminUsersSvc.get(id).subscribe({
      next: (u: any) => {
        this.loadingUser = false;
        if (!u) {
          this.errorMessage = 'Usuario no encontrado.';
          return;
        }
        this.userName = u.name ?? null;
        this.userRun = u.run ?? null;

        const runNum = Number(u.run ?? 0);
        if (!runNum) {
          this.errorMessage = 'RUN inválido.';
          return;
        }

        // request DAPs; adminDapService updates its BehaviorSubject
        const s2 = this.adminDapService.getDapListByRun(runNum).subscribe({ next: () => {}, error: (err) => {
          console.error('Error cargando daps', err);
          this.errorMessage = 'Error cargando depósitos.';
        }});
        this.subs.push(s2);
      },
      error: (err) => {
        this.loadingUser = false;
        console.error('Error cargando usuario', err);
        this.errorMessage = 'Error al cargar usuario.';
      },
    });
    this.subs.push(sub);
  }

  // safe helper to read ID (supports id or dap_id)
  getDapId(dap: Dap): number {
    return Number((dap as any)?.id ?? (dap as any)?.dap_id ?? 0);
  }

  // normalize textual statuses to canonical enum values
  normalizeStatus(raw: any): string {
    if (raw == null) return 'PENDING';
    const s = String(raw).trim().toUpperCase();
    if (s === 'PENDIENTE') return 'PENDING';
    if (s === 'ACTIVO') return 'ACTIVE';
    if (s === 'ANULADO') return 'ANNULLED';
    if (s === 'CANCELADO') return 'CANCELLED';
    // already canonical?
    if (['PENDING','ACTIVE','CANCELLED','ANNULLED','PAID','EXPIRED','EXPIRED-PENDING'].includes(s)) return s;
    return 'PENDING';
  }

  // label for UI from canonical value
  statusLabel(value?: string | null) {
    if (!value) return '-';
    const v = String(value).toUpperCase();
    const found = this.statuses.find((s) => s.value === v);
    return found ? found.label : v;
  }

  // trackBy for ngFor (arrow keeps lexical this safe)
  trackById = (index: number, item: any) => this.getDapId(item) || index;

  // Helper: get any existing internal id from dap object (supports different aliases)
  private getExistingInternalId(dap: Dap): string | null {
    return ((dap as any)?.internalId ?? (dap as any)?.internal_id ?? (dap as any)?.dap_internal_id ?? null) as string | null;
  }

  activateByInternalId(dap: Dap, internalId: string | null | undefined) {
    const dapId = this.getDapId(dap);
    const internal = String(internalId ?? '').trim();
    if (!dapId) return;

    // Clear previous messages for this dap
    this.activationErrMap[dapId] = null;
    this.activationMsgMap[dapId] = null;

    // First: check if DAP already has an internalId associated
    const existingInternal = this.getExistingInternalId(dap);
    if (existingInternal) {
      // Do not call backend; inform the admin
      this.activationErrMap[dapId] = `Este depósito a plazo ya tiene una id asociada: ${existingInternal}`;
      return;
    }

    if (!internal) {
      this.activationErrMap[dapId] = 'Debe ingresar ID interna';
      return;
    }

    this.isActivatingMap[dapId] = true;

    this.adminDapService.activateDapByInternalId(internal, dapId).subscribe({
      next: (res: any) => {
        this.isActivatingMap[dapId] = false;
        this.activationMsgMap[dapId] = res?.message ?? 'Activado';
        // update local UI: set internalId on this dap so future attempts are blocked
        try {
          (dap as any).internalId = internal;
        } catch {}

        const run = Number(this.userRun ?? 0);
        if (run) this.adminDapService.getDapListByRun(run).subscribe();
      },
      error: (err: any) => {
        this.isActivatingMap[dapId] = false;
        this.activationErrMap[dapId] = err?.error?.message ?? err?.message ?? 'Error al activar';
        console.error('activate error', err);
      }
    });
  }

  // saveStatus: logs + call to service
  saveStatus(dap: Dap) {
    const dapId = this.getDapId(dap);
    if (!dapId) return;
    const newStatus = this.selectedStatus[dapId];
    if (!newStatus) return;
    const run = Number(this.userRun ?? 0);
    if (!run) return;

    this.savingStatus[dapId] = true;
    console.log('saveStatus -> run:', run, 'dapId:', dapId, 'status:', newStatus);

    if (typeof (this.adminDapService as any).updateDapStatus !== 'function') {
      console.error('AdminDapService.updateDapStatus no existe.');
      this.savingStatus[dapId] = false;
      return;
    }

    (this.adminDapService as any).updateDapStatus(run, dapId, newStatus).subscribe({
      next: (res: any) => {
        console.log('saveStatus success', res);
        this.savingStatus[dapId] = false;
        // update local UI
        (dap as any).status = newStatus;
        if (run) this.adminDapService.getDapListByRun(run).subscribe();
      },
      error: (err: any) => {
        console.error('Error actualizando status', err);
        if (err?.error) console.error('Backend error body:', err.error);
        this.savingStatus[dapId] = false;
      },
    });
  }

  openDetail(dap: Dap) {
    try { (document.activeElement as HTMLElement)?.blur(); } catch {}
    this.dialog.open(DapDialogDetailsComponent, {
      width: '680px',
      data: dap,
      panelClass: 'dap-dialog',
    });
  }

  openAdminAttachments(dap: Dap) {
    try { (document.activeElement as HTMLElement)?.blur(); } catch {}
    const run = Number(this.userRun ?? 0);
    this.dialog.open(AdminDapAttachmentsComponent, {
      width: '780px',
      data: { run, dapId: this.getDapId(dap) },
      panelClass: 'dap-dialog',
    });
  }

  openAttachments(dap: Dap) { this.openAdminAttachments(dap); }
}