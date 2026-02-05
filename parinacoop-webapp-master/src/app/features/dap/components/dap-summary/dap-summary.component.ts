import { Component, Input } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dap-summary',
  standalone: true,
  imports: [CommonModule, AsyncPipe, RouterLink, CurrencyPipe],
  templateUrl: './dap-summary.component.html',
})
export class DapSummaryComponent {
  // Espera la misma forma que totals$ en DapComponent
  @Input() totals$?: Observable<{ totalInvested: number; activeCount: number } | null>;
}