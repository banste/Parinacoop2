import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'idPad',
  standalone: true,
})
export class IdPadPipe implements PipeTransform {
  transform(value: number): string {
    return `N° ${value.toString().padStart(6, '0')}`;
  }
}
