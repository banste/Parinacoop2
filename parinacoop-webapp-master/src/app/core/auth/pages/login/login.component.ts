// src/app/core/auth/pages/login/login.component.ts
import { NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
  loginSubscription?: Subscription;
  routeQuerySub?: Subscription;

  isSubmitting: boolean = false;
  loginErrorMsg: string = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly loginService: LoginService,
    private readonly router: Router,
    private readonly route: ActivatedRoute, // detect query params
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      run: ['', [Validators.required, runValidator]],
      password: ['', [Validators.required]],
    });

    // Detectar token en query params (ej: /login?token=xxxx) y redirigir a reset-password
    this.routeQuerySub = this.route.queryParamMap.subscribe((qp) => {
      const token = qp.get('token') ?? '';
      if (token) {
        // Navegar a la ruta de reset-password y pasar el token en query params
        // Ajusta la ruta si en tu proyecto está bajo /auth/reset-password en vez de /reset-password
        this.router.navigate(['/reset-password'], { queryParams: { token } });
      }
    });
  }

  ngOnDestroy(): void {
    this.loginSubscription?.unsubscribe();
    this.routeQuerySub?.unsubscribe();
  }

  onSubmit(): void {
    this.isSubmitting = true;
    this.loginForm.disable();
    const credentials = {
      run: +getRutDigits(this.loginForm.value.run!),
      password: this.loginForm.value.password!,
    };

    this.loginErrorMsg = '';
    this.loginSubscription = this.loginService.login(credentials).subscribe({
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

  // Método requerido por la plantilla cuando el usuario hace click en "Olvidé mi clave"
  onForgotPassword(event?: Event): void {
    event?.preventDefault();
    // Navegar a la ruta de recuperación (la que ya tienes: 'password-recovery')
    this.router.navigate([`/${ROUTE_TOKENS.PASSWORD_RECOVERY}`]);
  }
}