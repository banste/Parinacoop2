import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'tipoAhorro',
  standalone: true // si usas Standalone Components
})
export class TipoAhorroPipe implements PipeTransform {
  transform(value: string): string {
    switch (value) {
      case 'CA': return 'Cuenta de Ahorro';
      case 'IN': return 'Inversiones';
      default: return value;
    }
  }
}