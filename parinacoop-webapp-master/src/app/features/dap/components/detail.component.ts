import { Component, Input } from '@angular/core';

@Component({
  selector: 'dap-detail',
  standalone: true,
  imports: [],
  template: `
    <div class="grid w-[20rem] grid-cols-[50%_50%] py-1">
      <span class="font-medium text-primary-950">{{ label }}</span>
      <span class="text-primary-800 text-right">{{ value ?? '-' }}</span>
    </div>
  `,
})
export class DetailComponent {
  @Input() label: string = '';
  // Permitimos null/undefined: las plantillas pasarán '-' si falta
  @Input() value: string | null | undefined = '';
}