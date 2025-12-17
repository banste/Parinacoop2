import { Pipe, PipeTransform } from '@angular/core';
import { DapStatus } from '../models/dap-status.enum';

type DapStatusKeys = {
  [key in DapStatus]: string;
};

@Pipe({
  name: 'dapStatus',
  standalone: true,
})
export class DapStatusPipe implements PipeTransform {
  private keys: DapStatusKeys = {
    active: 'Activo',
    'expired-pending': 'Vencido (transferencia pendiente)',
    expired: 'Vencido',
    paid: 'Pagado',
    pending: 'Pendiente',
  };

  transform(value: DapStatus): string {
    return this.keys[value] ?? value;
  }
}
