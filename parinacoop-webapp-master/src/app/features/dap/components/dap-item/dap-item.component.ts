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
    CommonModule, // para directivas básicas y ngIf/ngFor si se usan dentro
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
    // Evitar abrir duplicados: revisamos diálogos ya abiertos
    this.authService.currentUser$.pipe(take(1)).subscribe((user) => {
      const alreadyOpen = this.dialog.openDialogs.find(d => {
        const inst = (d.componentInstance as any);
        return !!inst && inst.dapId === dap.id && (inst.constructor?.name === 'DapAttachmentsComponent' || inst instanceof DapAttachmentsComponent);
      });

      if (alreadyOpen) {
        try { alreadyOpen.updatePosition?.(); } catch {}
        return;
      }

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