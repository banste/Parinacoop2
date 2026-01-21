import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { getRutDigits } from '@fdograph/rut-utilities';

import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { SpinnerComponent } from '@app/shared/components/spinner/spinner.component';
import { AuthService } from '../../services/auth.service';
import { runValidator } from '@shared/validators/runValidator';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormFieldComponent, SpinnerComponent],
  templateUrl: './forgot-password.component.html',
})
export default class ForgotPasswordComponent implements OnInit {
  form!: FormGroup;
  isSubmitting = false;
  message = '';
  error = '';

  constructor(private fb: FormBuilder, private authService: AuthService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      // Solo RUN: acepta con o sin DV; runValidator valida formato
      run: ['', [Validators.required, runValidator]],
    });
  }

  fc(name: string): FormControl {
    return this.form.get(name) as FormControl;
  }

  /**
   * Formatea el valor del RUN mientras el usuario escribe.
   * - Permite números y 'k'/'K' como DV.
   * - Toma el último carácter como DV y formatea el resto con puntos.
   * - Actualiza el form control sin emitir eventos para evitar loops.
   */
  onRunInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input) return;

    // Normalizar: quitar todo excepto dígitos y 'k'/'K'
    let raw = String(input.value || '').replace(/[^0-9kK]/g, '');

    // Si queda vacío o es un solo carácter, deja como está (sin formato)
    if (raw.length <= 1) {
      this.fc('run').setValue(raw, { emitEvent: false });
      return;
    }

    // Separar DV (último carácter) y cuerpo (resto)
    const dv = raw.slice(-1);
    const body = raw.slice(0, -1);

    // Formatear cuerpo con puntos de miles: e.g. 8271125 -> 8.271.125
    const bodyFormatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    // Construir formato final (mantener DV en minúscula si es 'k')
    const formatted = `${bodyFormatted}-${dv.toLowerCase()}`;

    // Actualizar control sin emitir eventos (para no provocar validations/reloops)
    this.fc('run').setValue(formatted, { emitEvent: false });
  }

  onSubmit(): void {
    this.error = '';
    this.message = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Completa el RUN correctamente.';
      return;
    }

    // Extraer sólo los dígitos del RUT (sin DV)
    const raw = String(this.fc('run').value || '');
    const runDigitsRaw = getRutDigits(raw); // devuelve los dígitos del RUT (string)
    const runDigitsStr = String(runDigitsRaw).trim();

    if (!runDigitsStr) {
      this.error = 'RUN inválido.';
      return;
    }

    this.isSubmitting = true;

    // Enviamos sólo el run como STRING; el backend buscará el email y enviará el código automáticamente
    this.authService.forgotPassword({ run: runDigitsStr }).subscribe(
      (res: any) => {
        this.isSubmitting = false;
        if (res?.ok === false) {
          this.error = res?.error?.message ?? 'Error solicitando recuperación.';
          return;
        }
        this.message = 'Si la cuenta existe, se ha enviado un correo al email registrado para ese RUN.';
      },
      (err) => {
        this.isSubmitting = false;
        console.error('forgot error', err);
        this.error = err?.error?.message ?? 'Error solicitando recuperación.';
      },
    );
  }
}