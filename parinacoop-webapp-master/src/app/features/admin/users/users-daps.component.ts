import { Component, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { AdminUsersService } from './admin-users.service';
import { AdminDapService } from '../dap/admin-dap.service';
import { DapDialogDetailsComponent } from '@app/features/dap/components/dap-dialog-details/dap-dialog-details.component';
import { AdminDapAttachmentsComponent } from '../dap/admin-dap-attachments.component';
import { Observable } from 'rxjs';
import { Dap } from '@app/features/dap/models/dap.model';

@Component({
  selector: 'app-admin-users-daps',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatDialogModule,
    AsyncPipe,
    DapDialogDetailsComponent,
    AdminDapAttachmentsComponent,
  ],
  templateUrl: './users-daps.component.html',
  styleUrls: ['./users-daps.component.scss'],
})
export default class UsersDapsComponent implements OnInit {
  userName: string | null = null;
  userRun: string | null = null;
  daps$?: Observable<Dap[] | null>;

  loadingUser = false;
  errorMessage: string | null = null;

  isActivatingMap: Record<number, boolean> = {};
  activationMsgMap: Record<number, string | null> = {};
  activationErrMap: Record<number, string | null> = {};

  constructor(
    private route: ActivatedRoute,
    private adminUsersSvc: AdminUsersService,
    private adminDapService: AdminDapService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    // Observable stream of DAPs provided by the AdminDapService
    this.daps$ = this.adminDapService.daps$;

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

  private loadUserAndDaps(id: number): void {
    this.loadingUser = true;
    this.errorMessage = null;

    this.adminUsersSvc.get(id).subscribe({
      next: (u) => {
        this.loadingUser = false;
        if (!u) {
          this.errorMessage = 'Usuario no encontrado.';
          return;
        }

        this.userName = u.name ?? null;
        this.userRun = u.run ?? null;

        const runStr = String(u.run ?? '').trim();
        if (runStr === '') {
          this.errorMessage = 'El usuario no tiene RUN definido.';
          return;
        }

        const runNum = Number(runStr);
        if (isNaN(runNum)) {
          this.errorMessage = 'El RUN del usuario no es numérico; no se pueden listar depósitos.';
          return;
        }

        // Cargar DAPs usando el servicio admin (actualiza el BehaviorSubject internamente)
        this.adminDapService.getDapListByRun(runNum).subscribe({
          next: () => {},
          error: (err) => {
            console.error('UsersDapsComponent: admin daps load error', err);
            this.errorMessage = 'Error cargando depósitos (ver consola).';
          },
        });
      },
      error: (err) => {
        this.loadingUser = false;
        this.errorMessage = 'Error al cargar usuario.';
        console.error('UsersDapsComponent: error loading user', err);
      },
    });
  }

  trackById(index: number, item: any) {
    return item?.id ?? index;
  }

  activateByInternalId(dap: Dap, internalId: string | null | undefined) {
    const dapId = dap.id as number;
    if (!dapId || !internalId || internalId.trim() === '') {
      if (dapId) this.activationErrMap[dapId] = 'Debe ingresar una ID interna.';
      return;
    }

    // limpiar mensajes previos y marcar activating
    this.activationErrMap[dapId] = null;
    this.activationMsgMap[dapId] = null;
    this.isActivatingMap[dapId] = true;

    this.adminDapService.activateDapByInternalId(String(internalId).trim()).subscribe({
      next: (res) => {
        this.isActivatingMap[dapId] = false;
        this.activationMsgMap[dapId] = res?.message ?? 'Depósito activado correctamente';

        // refrescar lista si tenemos run
        const runNum = Number(this.userRun ?? 0);
        if (runNum > 0) {
          this.adminDapService.getDapListByRun(runNum).subscribe({ next: () => {}, error: () => {} });
        }
      },
      error: (err) => {
        this.isActivatingMap[dapId] = false;
        this.activationErrMap[dapId] = err?.error?.message ?? err?.message ?? 'Error al activar depósito';
        console.error('activateByInternalId error', err);
      },
    });
  }

  openDetail(dap: Dap): void {
    // blur activo para evitar warnings ARIA cuando material oculta el resto del DOM
    try { (document.activeElement as HTMLElement)?.blur(); } catch {}

    this.dialog.open(DapDialogDetailsComponent, {
      width: '680px',
      autoFocus: true,
      restoreFocus: true,
      data: dap,
      panelClass: 'dap-dialog',
    });
  }

  // Método que abre el diálogo admin de adjuntos
  openAdminAttachments(dap: Dap): void {
    try { (document.activeElement as HTMLElement)?.blur(); } catch {}

    const runNum = Number(dap.userRun ?? this.userRun);
    this.dialog.open(AdminDapAttachmentsComponent, {
      width: '780px',
      data: { run: runNum, dapId: dap.id },
      panelClass: 'dap-dialog',
    });
  }

  // Alias para compatibilidad con la plantilla que esperaba openAttachments(dap)
  openAttachments(dap: Dap): void {
    this.openAdminAttachments(dap);
  }
}