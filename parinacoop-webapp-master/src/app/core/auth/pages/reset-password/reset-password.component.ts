import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { getRutDigits } from '@fdograph/rut-utilities';

import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { SpinnerComponent } from '@app/shared/components/spinner/spinner.component';
import { AuthService } from '../../services/auth.service';
import { runValidator } from '@shared/validators/runValidator';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormFieldComponent, SpinnerComponent],
  templateUrl: './reset-password.component.html',
})
export default class ResetPasswordComponent implements OnInit {
  form!: FormGroup;
  isSubmitting = false;
  message = '';
  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group(
      {
        // Pedimos RUN (con o sin DV)
        run: ['', [Validators.required, runValidator]],
        token: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordsMatch }
    );

    // Rellenar token desde query param si llega por link
    this.route.queryParamMap.subscribe((q) => {
      const token = q.get('token') ?? '';
      if (token) {
        this.fc('token').setValue(token, { emitEvent: false });
      }
    });
  }

  fc(name: string): FormControl {
    return this.form.get(name) as FormControl;
  }

  passwordsMatch(group: FormGroup) {
    const a = group.get('newPassword')?.value;
    const b = group.get('confirmPassword')?.value;
    return a === b ? null : { notSame: true };
  }

  onSubmit(): void {
    this.error = '';
    this.message = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Completa los campos correctamente.';
      return;
    }

    this.isSubmitting = true;

    const rawRun = String(this.fc('run').value ?? '');
    const runDigits = String(getRutDigits(rawRun) ?? '').trim();
    const token = String(this.fc('token').value ?? '').trim();
    const newPassword = String(this.fc('newPassword').value ?? '');

    if (!runDigits || !token || !newPassword) {
      this.error = 'Faltan datos necesarios.';
      this.isSubmitting = false;
      return;
    }

    this.authService.resetPassword({ run: runDigits, token, newPassword }).subscribe(
      (res: any) => {
        this.isSubmitting = false;
        if (res?.ok === false) {
          this.error = res?.error?.message ?? 'Error al cambiar la contraseña.';
          return;
        }
        this.message = 'Contraseña cambiada correctamente. Redirigiendo al login...';
        setTimeout(() => this.router.navigate(['/auth/login']), 1500);
      },
      (err) => {
        this.isSubmitting = false;
        console.error('reset error', err);
        this.error = err?.error?.message ?? 'Error al cambiar la contraseña.';
      }
    );
  }
}