import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { formatRut, RutFormat } from '@fdograph/rut-utilities';

type FormatTypes = 'run' | 'noFormat';

@Component({
  selector: 'par-form-field',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, NgClass],
  templateUrl: './form-field.component.html',
})
export class FormFieldComponent {
  @Input() label: string = '';
  @Input() type: string = 'text';
  @Input() placeholder: string = '';
  @Input() format: FormatTypes = 'noFormat';
  @Input({ required: true }) formCtrl!: FormControl;
  @Input() errors: { [key: string]: string } = {};
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  changeValue(value: string): void {
    this.formCtrl.setValue(value);
  }

  onFocus(): void {
    const ctrlValue = this.formCtrl.value;
    if (ctrlValue && this.format === 'run') {
      this.changeValue(ctrlValue.replace(/[^0-9kK]/g, '')); // Quita el formato
    }
  }

  onBlur(): void {
    const ctrlValue = this.formCtrl.value;
    if (ctrlValue && this.format === 'run') {
      this.changeValue(formatRut(ctrlValue, RutFormat.DOTS_DASH)); // Aplica el formato
    }
  }

  onKeyPress(event: KeyboardEvent): boolean {
    if (this.format === 'run') {
      const allowedChars = /[0-9kK]/;
      const key = event.key;
      if (key === 'Enter') return true;

      // Permitir solo números y la letra 'K' o 'k'
      if (!allowedChars.test(key)) {
        event.preventDefault();
        return false;
      }
    }
    return true;
  }

  get errorMsg(): string {
    for (const errorKey in this.errors) {
      if (this.formCtrl.hasError(errorKey)) return this.errors[errorKey];
    }
    return '';
  }
}
