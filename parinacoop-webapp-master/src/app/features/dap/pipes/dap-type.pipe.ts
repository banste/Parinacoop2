import { Pipe, PipeTransform } from '@angular/core';
import { DapType } from '../models/dap-type.enum';

type DapTypeKeys = {
  [key in DapType]: string;
};

@Pipe({
  name: 'dapType',
  standalone: true,
})
export class DapTypePipe implements PipeTransform {
  private keys: DapTypeKeys = {
    DPF: 'Depósito a plazo fijo',
    DPR: 'Depósito a plazo renovable',
  };

  transform(value: DapType): string {
    return this.keys[value] ?? value;
  }
}
