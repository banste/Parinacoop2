import { CommonModule, AsyncPipe, CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Dap } from '../../models/dap.model';
import { DapStatusPipe } from '../../pipes/dap-status.pipe';
import { DapTypePipe } from '../../pipes/dap-type.pipe';
import { IdPadPipe } from '../../pipes/id-pad.pipe';
import { DapDialogDetailsComponent } from '../dap-dialog-details/dap-dialog-details.component';
import { DapAttachmentsComponent } from '../dap-attachments/dap-attachments.component';
import { AuthService } from '@app/core/auth/services/auth.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-dap-item',
  standalone: true,
  imports: [
    CommonModule,
    NgClass,
    DatePipe,
    CurrencyPipe,
    DapStatusPipe,
    DapTypePipe,
    IdPadPipe,
    AsyncPipe,
  ],
  templateUrl: './dap-item.component.html',
})
export class DapItemComponent {
  @Input({ required: true }) dap!: Dap;

  // queda por compatibilidad, pero no se usa para panel inline ahora
  showAttachments = false;

  constructor(private dialog: MatDialog, public authService: AuthService) {}

  openDialog(data: Dap): void {
    this.dialog.open(DapDialogDetailsComponent, {
      width: '680px',
      autoFocus: true,
      restoreFocus: true,
      data,
    });
  }

  openAttachments(dap: Dap): void {
    // Aseguramos no tener panel inline abierto (por si queda alguna lógica previa)
    this.showAttachments = false;

    this.authService.currentUser$.pipe(take(1)).subscribe((user) => {
      // Evitar abrir múltiples diálogos duplicados para el mismo dap.id
      const alreadyOpen = this.dialog.openDialogs.find(d => {
        const inst = (d.componentInstance as any);
        return !!inst && inst.dapId === dap.id && (inst.constructor?.name === 'DapAttachmentsComponent' || inst instanceof DapAttachmentsComponent);
      });

      if (alreadyOpen) {
        // Si ya hay uno abierto para el mismo DAP, traemos al frente (si se puede) y no abrimos otro
        try { alreadyOpen.updatePosition?.(); } catch {}
        return;
      }

      // abrir nuevo diálogo
      this.dialog.open(DapAttachmentsComponent, {
        width: '720px',
        maxHeight: '80vh',
        panelClass: 'dap-dialog',
        data: {
          dapId: dap.id,
          userRun: user?.run ?? null,
        },
      });
    });
  }
}