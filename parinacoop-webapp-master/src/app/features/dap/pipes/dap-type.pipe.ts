import { Pipe, PipeTransform } from '@angular/core';
import { DapType } from '../models/dap-type.enum';

/**
 * Acepta DapType | string | null | undefined para evitar errores de strictTemplates
 */
@Pipe({
  name: 'dapType',
  standalone: true,
})
export class DapTypePipe implements PipeTransform {
  private readonly keys: Record<string, string> = {
    DPF: 'Depósito a plazo fijo',
    DPR: 'Depósito a plazo renovable',
  };

  transform(value: DapType | string | null | undefined): string {
    const key = (value ?? '').toString();
    if (!key) return '-';
    return this.keys[key] ?? key;
  }
}