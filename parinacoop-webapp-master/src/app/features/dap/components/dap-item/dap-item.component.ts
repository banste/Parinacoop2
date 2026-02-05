import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Dap } from '../../models/dap.model';

@Component({
  selector: 'app-dap-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dap-item.component.html',
  styleUrls: ['./dap-item.component.scss'],
})
export class DapItemComponent {
  @Input() dap!: Dap | any;

  @Output() viewDetail = new EventEmitter<Dap>();
  @Output() viewAttachments = new EventEmitter<Dap>();

  formatId(id: any): string {
    if (id == null || id === '') return '-';
    const s = String(id);
    return s.padStart(6, '0');
  }

  formatInvestmentDate(dap: any): string {
    const candidates = [
      dap?.initial_date,
      dap?.initialDate,
      dap?.investmentDate,
      dap?.startDate,
      dap?.openingDate,
      dap?.createdAt,
      dap?.date,
      dap?.startedAt,
    ];
    const raw = candidates.find((v) => v !== undefined && v !== null && String(v).trim() !== '');
    if (!raw) return '-';

    const d = this._parseDate(raw);
    if (!d) return String(raw);
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  // Compatibilidad con template (interés)
  getInterestAmount(dap: any): number | null {
    return this.computeInterest(dap);
  }

  computeInterest(dap: any): number | null {
    if (!dap) return null;

    const explicitFields = ['interestAmount', 'interestGain', 'gain', 'earnedInterest', 'interest'];
    for (const k of explicitFields) {
      const v = dap?.[k];
      if (v != null && !isNaN(Number(v))) return Number(v);
    }

    const initialCandidates = ['initialAmount', 'principal', 'amount', 'capital'];
    const finalCandidates = ['finalAmount', 'montoRecibir', 'amountToReceive', 'finalValue'];

    let initial: number | null = null;
    let finalAmount: number | null = null;

    for (const k of initialCandidates) {
      if (dap?.[k] != null && !isNaN(Number(dap[k]))) {
        initial = Number(dap[k]);
        break;
      }
    }
    for (const k of finalCandidates) {
      if (dap?.[k] != null && !isNaN(Number(dap[k]))) {
        finalAmount = Number(dap[k]);
        break;
      }
    }

    if (initial != null && finalAmount != null) {
      return finalAmount - initial;
    }

    const rateCandidates = ['rate', 'interestRate', 'annualRate'];
    let rate: number | null = null;
    for (const k of rateCandidates) {
      if (dap?.[k] != null && !isNaN(Number(dap[k]))) {
        rate = Number(dap[k]);
        break;
      }
    }

    const termCandidates = ['termDays', 'days', 'periodDays', 'term', 'plazoDias'];
    let termDays: number | null = null;
    for (const k of termCandidates) {
      if (dap?.[k] != null && !isNaN(Number(dap[k]))) {
        termDays = Number(dap[k]);
        break;
      }
    }

    if (termDays == null) {
      const start = this._parseDate(
        dap?.initial_date ??
        dap?.initialDate ??
        dap?.investmentDate ??
        dap?.startDate ??
        dap?.createdAt ??
        dap?.date,
      );
      const due = this._parseDate(dap?.dueDate ?? dap?.vencimiento ?? dap?.maturityDate);
      if (start && due) {
        const diff = Math.ceil((due.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (diff > 0) termDays = diff;
      }
    }

    if (initial != null && rate != null && termDays != null) {
      let r = rate;
      if (r > 1) r = r / 100;
      const interest = initial * r * (termDays / 360);
      return isNaN(interest) ? null : interest;
    }

    return null;
  }

  // Nuevos helpers para mostrar estado legible y clase de color
  statusLabel(status: any): string {
    if (!status && status !== 0) return '-';
    const s = String(status).toLowerCase();
    if (s === 'active' || s === 'activo') return 'Activo';
    if (s === 'pending' || s === 'pendiente') return 'Pendiente';
    // fallback: capitalizar primera letra
    return String(status).charAt(0).toUpperCase() + String(status).slice(1);
  }

  statusDotClass(status: any): string {
    const s = String(status ?? '').toLowerCase();
    if (s === 'active' || s === 'activo') return 'status-green';
    if (s === 'pending' || s === 'pendiente') return 'status-yellow';
    return 'status-default';
  }

  formatStatus(status: any): string {
    if (status == null || String(status).trim() === '') return '-';
    return String(status).toUpperCase();
  }

  private _parseDate(value: any): Date | null {
    if (!value && value !== 0) return null;
    if (typeof value === 'number') {
      const maybeSeconds = value < 1e10;
      const ms = maybeSeconds ? value * 1000 : value;
      const dnum = new Date(ms);
      return isNaN(dnum.getTime()) ? null : dnum;
    }
    try {
      const s = String(value).trim();
      if (/^\d+$/.test(s)) {
        const n = Number(s);
        const maybeSeconds = n < 1e10;
        const ms = maybeSeconds ? n * 1000 : n;
        const dnum = new Date(ms);
        if (!isNaN(dnum.getTime())) return dnum;
      }
      const ds = new Date(s);
      return isNaN(ds.getTime()) ? null : ds;
    } catch {
      return null;
    }
  }

  onViewDetailClick(): void {
    this.viewDetail.emit(this.dap);
  }

  onViewAttachmentsClick(): void {
    this.viewAttachments.emit(this.dap);
  }
}