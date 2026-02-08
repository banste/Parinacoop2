import { Component, Input, OnChanges, OnInit, SimpleChanges, SimpleChange } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { DapStatusPipe } from '../../pipes/dap-status.pipe';

@Component({
  selector: 'app-cancelled-daps',
  standalone: true,
  imports: [CommonModule, HttpClientModule, DapStatusPipe],
  templateUrl: './cancelled-daps.component.html',
  styleUrls: ['./cancelled-daps.component.scss'],
})
export class CancelledDapsComponent implements OnInit, OnChanges {
  @Input() run?: number | null;

  daps: any[] = [];
  loading = false;
  error: string | null = null;

  constructor(private http: HttpClient) {}

  // Se ejecuta cuando cambia cualquier @Input
  ngOnChanges(changes: SimpleChanges): void {
    // SimpleChanges usa firma de índice; hay que acceder con ['run']
    const runChange: SimpleChange | undefined = changes['run'];
    if (runChange && runChange.currentValue != null) {
      this.loadCancelled(Number(runChange.currentValue));
    }
  }

  // fallback: si no se pasa run por @Input, intenta obtenerlo de window (mantener compatibilidad)
  ngOnInit(): void {
    if (this.run == null) {
      const runFromWindow = (window as any).__CURRENT_USER_RUN__ ?? null;
      if (runFromWindow) {
        this.loadCancelled(Number(runFromWindow));
      }
    }
  }

  loadCancelled(run: number) {
    this.loading = true;
    this.error = null;
    this.http.get<{ daps: any[] }>(`/clients/${run}/daps/cancelled`).subscribe({
      next: (res) => {
        this.daps = res.daps ?? [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando DAPs cancelados', err);
        this.error = 'No se pudo cargar los depósitos cancelados';
        this.loading = false;
      },
    });
  }
}