import { Component, Input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-saving-item',
  standalone: true,
  imports: [CurrencyPipe],
  template: `
    <div class="rounded border p-3">
      <h4 class="font-bold">{{ account.nombre || ('Cuenta #' + account.id) }}</h4>
      <div>Monto: {{ account.balance | currency:'CLP':'symbol' }}</div>
      <div>Interés: {{ account.interest | currency:'CLP':'symbol' }}</div>
    </div>
  `
})
export class CuentaAhorroItemComponent {
  @Input() account: any;
}