import { CommonModule, AsyncPipe, DatePipe, CurrencyPipe, NgClass } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Dap } from '../../models/dap.model';
import { DapStatusPipe } from '../../pipes/dap-status.pipe';
import { DapTypePipe } from '../../pipes/dap-type.pipe';
import { IdPadPipe } from '../../pipes/id-pad.pipe';

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
  styleUrls: ['./dap-item.component.scss'],
  providers: [DatePipe]
})
export class DapItemComponent {
  @Input({ required: true }) dap!: Dap;
  @Output() viewDetail = new EventEmitter<Dap>();
  @Output() viewAttachments = new EventEmitter<Dap>();

  constructor(private datePipe: DatePipe) {}

  // -----------------------
  // Utility / formatters
  // -----------------------
  formatInvestmentDate(dapObj: any): string {
    if (!dapObj) { return '-'; }
    const candidates = [
      'initial_date', 'initialDate', 'initial_at',
      'investmentDate','investment_date','investment_at',
      'createdAt','created_at','created',
      'dateCreated','date_created','date',
      'startDate','start_date','fecha','fechaCreacion','fecha_creacion'
    ];
    let raw: any = null;
    for (const key of candidates) {
      if (key in dapObj && dapObj[key]) { raw = dapObj[key]; break; }
    }
    if (!raw) { return '-'; }
    const formatted = this.datePipe.transform(raw, 'dd-MM-yyyy');
    return formatted ?? '-';
  }

  formatId(rawId: any): string {
    if (rawId === null || rawId === undefined) { return ''; }
    const s = String(rawId);
    const digits = s.replace(/\D/g, '');
    return digits ? digits.padStart(6, '0') : s;
  }

  formatStatus(status: string | undefined | null): string {
    if (!status) { return '-'; }
    return String(status).toUpperCase();
  }

  // devuelve el monto de interes (profit) o lo calcula (final - initial) cuando es posible
  getInterestAmount(dapObj: any): number | null {
    if (!dapObj) return null;
    const profitAliases = [dapObj.profit, dapObj.ganancia, dapObj.interestAmount, dapObj.interes, dapObj.interest];
    for (const p of profitAliases) {
      const n = Number(p ?? NaN);
      if (!isNaN(n) && n !== 0) return n;
    }

    const finalA = Number(dapObj.finalAmount ?? dapObj.final_amount ?? dapObj.final);
    const initA = Number(dapObj.initialAmount ?? dapObj.initial_amount ?? dapObj.initial);
    if (!isNaN(finalA) && !isNaN(initA)) {
      const diff = finalA - initA;
      return isNaN(diff) ? null : diff;
    }
    return null;
  }

  // -----------------------
  // Emit events to parent
  // -----------------------
  onViewDetail(): void {
    this.viewDetail.emit(this.dap);
  }

  onViewAttachments(): void {
    this.viewAttachments.emit(this.dap);
  }
}