import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { FormFieldComponent } from '@app/shared/components';
import { SpinnerComponent } from '@app/shared/components/spinner/spinner.component';
import { GroupEvery3Directive } from '@app/shared/directives/group-every-3.directive';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormFieldComponent,
    SpinnerComponent,
    GroupEvery3Directive,
  ],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent implements OnInit {
  form!: FormGroup;
  isSubmitting = false;
  message = '';
  error = '';

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    // Inicializar el formulario aquí (ya existe this.fb)
    this.form = this.fb.group({
      run: [''],
      email: ['', [Validators.email]],
    });
  }

  fc(name: string): FormControl {
    return this.form.get(name) as FormControl;
  }

  async onSubmit() {
    this.error = '';
    this.message = '';

    if (!this.fc('run').value && !this.fc('email').value) {
      this.error = 'Ingresa tu RUN o correo electrónico.';
      return;
    }

    const payload: any = {};
    if (this.fc('run').value) payload.run = String(this.fc('run').value);
    if (this.fc('email').value) payload.email = String(this.fc('email').value);

    this.isSubmitting = true;
    try {
      await this.http.post('/api/auth/forgot-password', payload).toPromise();
      this.message =
        'Si el usuario existe, se ha enviado un código a su correo. Revisa tu bandeja y sigue el enlace o copia el código.';
      // opcional: redirigir automáticamente, por ejemplo:
      // this.router.navigate(['/auth/reset-password']);
    } catch (err: any) {
      console.error('forgot error', err);
      this.error = err?.error?.message ?? 'Error solicitando código';
    } finally {
      this.isSubmitting = false;
    }
  }
}