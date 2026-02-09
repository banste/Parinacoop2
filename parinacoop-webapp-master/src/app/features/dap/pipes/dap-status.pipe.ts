import { Pipe, PipeTransform } from '@angular/core';
import { DapStatus } from '../models/dap-status.enum';

/**
 * Devuelve la etiqueta de estado en español en minúsculas.
 * Esto evita tener etiquetas en mayúsculas como "ACTIVE" y produce "activo".
 */
@Pipe({
  name: 'dapStatus',
  standalone: true,
})
export class DapStatusPipe implements PipeTransform {
  // Mapa con claves string para ser flexible (todas en minúscula)
  private readonly keys: Record<string, string> = {
    active: 'Activo',
    'expired-pending': 'Vencido (transferencia pendiente)',
    expired: 'Vencido',
    paid: 'Pagado',
    pending: 'Pendiente',
    cancelled: 'Cancelado',
    annulled: 'Anulado',
  };

  transform(value: DapStatus | string | null | undefined): string {
    const key = (value ?? '').toString();
    if (!key) return '-';
    // Normalizar a minúsculas para hacer la búsqueda robusta
    const k = key.toLowerCase();
    return this.keys[k] ?? k;
  }
}