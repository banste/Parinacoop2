import { NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { validateRut, getRutDigits } from '@fdograph/rut-utilities';

import { FormGroupTypeBuilder } from '@app/shared/types';
import { SpinnerComponent } from '@app/shared/components';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';

import { LoginService } from './login.service';
import { ROUTE_TOKENS } from '@app/route-tokens';
import { runValidator } from '@shared/validators/runValidator';

type LoginForm = FormGroupTypeBuilder<{
  run: string;
  password: string;
}>;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass, SpinnerComponent, FormFieldComponent],
  templateUrl: './login.component.html',
})
export default class LoginComponent implements OnInit, OnDestroy {
  loginForm!: LoginForm;
  loginSubscription!: Subscription;

  isSubmitting: boolean = false;
  loginErrorMsg: string = '';
  constructor(
    private readonly fb: FormBuilder,
    private readonly loginService: LoginService,
    private readonly router: Router,
  ) {}
  ngOnInit(): void {
    this.loginForm = this.fb.group({
      run: ['', [Validators.required, runValidator]],
      password: ['', [Validators.required]],
    });
  }

  ngOnDestroy(): void {
    this.loginSubscription?.unsubscribe();
  }

  onSubmit(): void {
    this.isSubmitting = true;
    this.loginForm.disable();
    const credentials = {
      run: +getRutDigits(this.loginForm.value.run!),
      password: this.loginForm.value.password!,
    };

    this.loginErrorMsg = '';
    this.loginService.login(credentials).subscribe({
      next: (response) => {
        console.log(response.accessToken);

        // Navegación absoluta para evitar duplicados relativos
        const clientTarget = `/${ROUTE_TOKENS.CLIENT_PATH}`;
        const adminTarget = `/${ROUTE_TOKENS.ADMIN_PATH}`;

        if (response.isClient) {
          this.router.navigateByUrl(clientTarget);
        } else {
          this.router.navigateByUrl(adminTarget);
        }

        this.isSubmitting = false;
        this.loginForm.enable();
      },
      error: ({ error }) => {
        this.loginErrorMsg = error.message;
        this.isSubmitting = false;
        this.loginForm.enable();
      },
    });
  }

  fc(name: string): FormControl {
    return this.loginForm.get(name) as FormControl;
  }

  // Método agregado: navegación programática a la ruta de recuperación
  onForgotPassword(event?: MouseEvent): void {
    if (event) event.preventDefault();
    console.log('onForgotPassword clicked');
    // La ruta de recuperación está definida por ROUTE_TOKENS.PASSWORD_RECOVERY ('password-recovery').
    // Dado que AUTH_PATH === '' en ROUTE_TOKENS, la ruta completa es '/password-recovery'.
    this.router
      .navigate(['/', ROUTE_TOKENS.PASSWORD_RECOVERY])
      .then((result) => console.log('router.navigate result:', result))
      .catch((err) => console.error('Navigation error to password recovery', err));
  }
}