import { Component, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { AdminUsersService } from './admin-users.service';
import { AdminDapService } from '../dap/admin-dap.service';
import { SvgIconComponent } from '@app/shared/components';
import { Observable } from 'rxjs';
import { Dap } from '@app/features/dap/models/dap.model';

// Dialog components (standalone) from the dap feature
import { DapDialogDetailsComponent } from '@app/features/dap/components/dap-dialog-details/dap-dialog-details.component';
import { DapAttachmentsComponent } from '@app/features/dap/components/dap-attachments/dap-attachments.component';

@Component({
  selector: 'app-admin-users-daps',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatDialogModule,
    SvgIconComponent,
    AsyncPipe,
    DapDialogDetailsComponent,
    DapAttachmentsComponent,
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

  // mapas para estado por dap.id
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

        // Llamamos al servicio admin para cargar DAPs (Admin token required)
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
      if (dapId) {
        this.activationErrMap[dapId] = 'Debe ingresar una ID interna.';
      } else {
        alert('DAP inválido o sin identificador.');
      }
      return;
    }

    // limpiar mensajes previos
    this.activationErrMap[dapId] = null;
    this.activationMsgMap[dapId] = null;
    this.isActivatingMap[dapId] = true;

    this.adminDapService.activateDapByInternalId(String(internalId).trim()).subscribe({
      next: (res) => {
        this.isActivatingMap[dapId] = false;
        this.activationMsgMap[dapId] = res?.message ?? 'Depósito activado correctamente';
        // refrescar lista
        const runNum = Number(this.userRun ?? 0);
        if (runNum > 0) {
          this.adminDapService.getDapListByRun(runNum).subscribe({ next: () => {}, error: () => {} });
        }
      },
      error: (err) => {
        this.isActivatingMap[dapId] = false;
        this.activationErrMap[dapId] = err?.error?.message ?? 'Error al activar depósito';
        console.error('activateByInternalId error', err);
      },
    });
  }

  // Abre el diálogo de detalles reutilizando el componente que ya existe
  openDetail(dap: Dap): void {
    this.dialog.open(DapDialogDetailsComponent, {
      width: '680px',
      autoFocus: true,
      restoreFocus: true,
      data: dap,
      panelClass: 'dap-dialog',
    });
  }

  // Abre el gestor de adjuntos (componente existente)
  openAttachments(dap: Dap): void {
    // si tu DapAttachmentsComponent espera datos distintos, ajusta el "data" en consecuencia
    this.dialog.open(DapAttachmentsComponent, {
      width: '720px',
      maxHeight: '80vh',
      panelClass: 'dap-dialog',
      data: {
        dapId: dap.id,
        userRun: dap.userRun ?? this.userRun,
      },
    });
  }
}