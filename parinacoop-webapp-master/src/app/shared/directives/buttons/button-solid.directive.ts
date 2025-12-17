import { Directive, HostBinding } from '@angular/core';

const base =
  'flex items-center justify-center rounded-full border h-[2.625rem] w-48 border-primary-500 bg-primary-500 px-4 py-2 text-white transition-colors duration-150';
const hover = 'hover:border-primary-600 hover:bg-primary-600';
const disabled =
  'disabled:border-primary-100 disabled:bg-primary-100 disabled:text-primary-400';

@Directive({
  selector: '[appButtonSolid]',
  standalone: true,
})
export class ButtonSolidDirective {
  @HostBinding('class')
  private twClasses = `${base} ${hover} ${disabled}`;

  constructor() {}
}
