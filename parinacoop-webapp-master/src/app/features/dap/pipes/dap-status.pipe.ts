import { Pipe, PipeTransform } from '@angular/core';
import { DapStatus } from '../models/dap-status.enum';

/**
 * Acepta DapStatus | string | null | undefined para evitar errores de strictTemplates
 */
@Pipe({
  name: 'dapStatus',
  standalone: true,
})
export class DapStatusPipe implements PipeTransform {
  // Mapa con claves string para ser flexible
  private readonly keys: Record<string, string> = {
    active: 'Activo',
    'expired-pending': 'Vencido (transferencia pendiente)',
    expired: 'Vencido',
    paid: 'Pagado',
    pending: 'Pendiente',
    cancelled: 'Cancelado', // nuevo
    annulled: 'Anulado',    // nuevo (no debería mostrarse en UI si lo excluimos en backend)
  };

  transform(value: DapStatus | string | null | undefined): string {
    const key = (value ?? '').toString();
    // Si no hay traducción devolvemos la cadena (o '-' si es vacío)
    if (!key) return '-';
    return this.keys[key] ?? key;
  }
}