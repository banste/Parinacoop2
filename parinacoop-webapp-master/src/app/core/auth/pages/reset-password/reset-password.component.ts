import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { FormFieldComponent } from '@app/shared/components';
import { SpinnerComponent } from '@app/shared/components/spinner/spinner.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormFieldComponent, SpinnerComponent],
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent implements OnInit {
  form!: FormGroup;
  isSubmitting = false;
  error = '';
  message = '';

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    // Inicializar el formulario aquí (usar this.fb ya inyectado)
    this.form = this.fb.group({
      token: ['', Validators.required], // código/token que llegó por correo
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    });
  }

  fc(name: string): FormControl {
    return this.form.get(name) as FormControl;
  }

  async onSubmit() {
    this.error = '';
    this.message = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Completa los campos correctamente.';
      return;
    }

    if (this.fc('newPassword').value !== this.fc('confirmPassword').value) {
      this.error = 'Las contraseñas no coinciden.';
      return;
    }

    this.isSubmitting = true;
    try {
      const payload = {
        token: String(this.fc('token').value).trim(),
        newPassword: String(this.fc('newPassword').value),
      };
      await this.http.post('/api/auth/reset-password', payload).toPromise();
      this.message = 'Contraseña actualizada. Ya puedes iniciar sesión con tu nueva clave.';
      // redirigir al login después de un momento
      setTimeout(() => this.router.navigate(['/auth/login']), 1400);
    } catch (err: any) {
      console.error('reset error', err);
      this.error = err?.error?.message ?? 'Error al resetear la contraseña.';
    } finally {
      this.isSubmitting = false;
    }
  }
}