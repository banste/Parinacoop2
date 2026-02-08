import { Component, Input, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { DapService } from '../../dap.service';
import { Dap } from '../../models/dap.model';
import { DapDialogDetailsComponent } from '../dap-dialog-details/dap-dialog-details.component';

@Component({
  selector: 'app-cancelled-daps',
  standalone: true,
  imports: [CommonModule, AsyncPipe, MatDialogModule, DapDialogDetailsComponent],
  templateUrl: './cancelled-daps.component.html',
  styleUrls: ['./cancelled-daps.component.scss'],
})
export class CancelledDapsComponent implements OnInit {
  @Input() run?: number | null;

  daps: Dap[] = [];
  loading = false;
  error: string | null = null;

  constructor(private dapService: DapService, private dialog: MatDialog) {}

  ngOnInit(): void {
    if (!this.run) {
      // fallback: intenta obtener el run actualmente cargado en el servicio
      const runFromService = this.dapService.getCurrentRun();
      if (runFromService) {
        this.run = runFromService;
      }
    }

    if (this.run) {
      this.loadCancelled(Number(this.run));
    } else {
      this.error = 'No se encontró RUN de usuario para mostrar el historial';
    }
  }

  loadCancelled(run: number) {
    this.loading = true;
    this.error = null;
    this.dapService.getCancelledList(run).subscribe({
      next: (list) => {
        this.daps = list ?? [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando DAPs cancelados', err);
        this.error = 'No se pudo cargar los depósitos cancelados';
        this.loading = false;
      },
    });
  }

  // Abre el diálogo de detalles (mismo comportamiento que en la lista principal)
  openDetail(dap: Dap): void {
    try {
      this.dialog.open(DapDialogDetailsComponent, {
        width: '680px',
        autoFocus: true,
        restoreFocus: true,
        data: dap,
      });
    } catch (err) {
      console.error('openDetail dialog e            rror', err);
    }
  }
}