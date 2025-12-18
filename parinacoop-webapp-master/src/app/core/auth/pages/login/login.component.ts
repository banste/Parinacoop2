import { NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  ValidatorFn,
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
import { rutToNumber } from '@shared/utils/rut-utils';

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
      run: rutToNumber(this.loginForm.value.run!),
      password: this.loginForm.value.password!,
    };

    console.log('RUN que se está enviando:', credentials.run);

    this.loginErrorMsg = '';
    this.loginService.login(credentials).subscribe({
      next: (response) => {
        console.log(response.accessToken);
        response.isClient
          ? this.router.navigate([ROUTE_TOKENS.CLIENT_PATH])
          : this.router.navigate([ROUTE_TOKENS.ADMIN_PATH]);
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
}
