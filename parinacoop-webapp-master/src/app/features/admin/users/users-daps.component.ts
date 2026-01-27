import { Component, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AdminUsersService } from './admin-users.service';
import { AdminDapService } from '../dap/admin-dap.service';
import { DapItemComponent } from '@app/features/dap/components/dap-item/dap-item.component';
import { SvgIconComponent } from '@app/shared/components';
import { Observable } from 'rxjs';
import { Dap } from '@app/features/dap/models/dap.model';

@Component({
  selector: 'app-admin-users-daps',
  standalone: true,
  imports: [CommonModule, RouterModule, SvgIconComponent, DapItemComponent, AsyncPipe],
  template: `
    <section class="max-w-[1100px] mx-auto px-4 py-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">Depósitos a plazo</h1>
          <p class="text-sm text-gray-600 mt-1">
            Depósitos del usuario:
            <span *ngIf="userName; else noUser">{{ userName }}</span>
            <ng-template #noUser>—</ng-template>
            <span *ngIf="userRun"> (RUN: {{ userRun }})</span>
          </p>
        </div>

        <div>
          <a routerLink="/admin/usuarios" class="text-sm text-blue-600 hover:underline">← Volver a usuarios</a>
        </div>
      </div>

      <div *ngIf="loadingUser" class="mb-4 text-sm text-gray-600">Cargando información del usuario...</div>
      <div *ngIf="errorMessage" class="mb-4 text-sm text-red-600">{{ errorMessage }}</div>

      <ng-container *ngIf="!errorMessage">
        <ng-container *ngIf="daps$ | async as daps; else loadingDaps">
          <ng-container *ngIf="daps?.length; else empty">
            <div class="space-y-2">
              <ng-container *ngFor="let dap of daps">
                <div class="py-1">
                  <app-dap-item [dap]="dap"></app-dap-item>
                </div>
              </ng-container>
            </div>
          </ng-container>
        </ng-container>
      </ng-container>

      <ng-template #loadingDaps>
        <div class="text-center py-8">Cargando depósitos...</div>
      </ng-template>

      <ng-template #empty>
        <div class="text-center py-8">No se encontraron depósitos para este usuario</div>
      </ng-template>
    </section>
  `,
})
export default class UsersDapsComponent implements OnInit {
  userName: string | null = null;
  userRun: string | null = null;
  daps$?: Observable<Dap[] | null>;

  loadingUser = false;
  errorMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private adminUsersSvc: AdminUsersService,
    private adminDapService: AdminDapService,
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
}