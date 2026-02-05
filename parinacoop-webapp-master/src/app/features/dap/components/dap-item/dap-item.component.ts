import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Dap } from '../../models/dap.model';

@Component({
  selector: 'app-dap-item',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  templateUrl: './dap-item.component.html',
  styleUrls: ['./dap-item.component.scss'],
})
export class DapItemComponent {
  @Input() dap!: Dap | any;

  // Emitimos los eventos para que DapComponent los maneje (openDialog/openAttachments)
  @Output() viewDetail = new EventEmitter<Dap>();
  @Output() viewAttachments = new EventEmitter<Dap>();

  // Helpers sencillos — reemplaza por tus implementaciones si ya existen
  formatId(id: any): string {
    if (id == null) return '-';
    const s = String(id);
    return s.padStart(6, '0');
  }

  formatInvestmentDate(dap: any): string {
    // si ya tienes un helper en el componente real, úsalo. Aquí una versión segura.
    const raw = dap?.investmentDate ?? dap?.createdAt ?? dap?.date;
    if (!raw) return '-';
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return String(raw);
      return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return String(raw);
    }
  }

  getInterestAmount(dap: any): number | null {
    // intenta varios campos que puedan existir en el modelo
    const candidates = ['interestAmount', 'interest', 'accruedInterest', 'gain'];
    for (const k of candidates) {
      const v = dap?.[k];
      if (v != null && !isNaN(Number(v))) return Number(v);
    }
    return null;
  }

  formatStatus(status: any): string {
    if (status == null) return '-';
    return String(status).toUpperCase();
  }

  // Métodos locales que llaman a los emitters (útiles si quieres lógica previa)
  onViewDetailClick(): void {
    this.viewDetail.emit(this.dap);
  }

  onViewAttachmentsClick(): void {
    this.viewAttachments.emit(this.dap);
  }
}