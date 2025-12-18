import { filter, Observable, Subject, takeUntil } from 'rxjs';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AsyncPipe, NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { FormFieldComponent } from '@app/shared/components';
import { AuthService } from '@app/core/auth/services/auth.service';
import { ROUTE_TOKENS } from '@app/route-tokens';

import { NewDapService } from './new-dap.service';
import { TermOption } from './models/TermOption';
import { TermOptionComponent } from './components/term-option/term-option.component';
import { ButtonSolidDirective } from '@app/shared/directives/buttons/button-solid.directive';

@Component({
  selector: 'app-new-dap',
  standalone: true,
  imports: [
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    FormFieldComponent,
    TermOptionComponent,
    AsyncPipe,
    MatProgressSpinnerModule,
    NgClass,
    ButtonSolidDirective,
  ],
  templateUrl: './new-dap.component.html',
})
export default class NewDapComponent implements OnInit, OnDestroy {
  public simulateFirstForm = new FormGroup({
    type: new FormControl('', [Validators.required]),
    initialAmount: new FormControl('', [
      Validators.required,
      Validators.min(50000),
    ]),
  });
  public simulateSecondForm = new FormGroup({
    termOption: new FormControl<TermOption | null>(null, [Validators.required]),
    accept: new FormControl(false, [Validators.requiredTrue]),
  });

  get selectedTermOption(): TermOption | null {
    return this.simulateSecondForm.controls.termOption.value;
  }
  onDestroy$ = new Subject<void>();
  termOptions$?: Observable<TermOption[] | null>;
  firstFormSubmitted = false;
  isSubmitting = false;
  private userRun: number = 0;

  constructor(
    private authService: AuthService,
    private router: Router,
    private newDapService: NewDapService,
  ) {}

  ngOnInit(): void {
    this.termOptions$ = this.newDapService.termOptions$;
    this.authService.currentUser$
      .pipe(
        takeUntil(this.onDestroy$),
        filter((user) => user !== null),
      )
      .subscribe((user) => {
        this.userRun = user.run;
      });
  }
  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  getTermOptions(): void {
    this.newDapService.resetTermOptions();
    const { type, initialAmount } = this.simulateFirstForm.value;
    this.newDapService.getTermOptions(type!, +initialAmount!);
    this.firstFormSubmitted = true;
  }

  selectTermOption(val: TermOption): void {
    this.simulateSecondForm.controls.termOption.setValue(val);
  }

  handleSubmit(): void {
    this.isSubmitting = true;
    const { initialAmount, type } = this.simulateFirstForm.value;

    const days = +this.simulateSecondForm.value.termOption!.days;
    this.newDapService
      .createDap({
        userRun: this.userRun,
        currencyType: 'CLP',
        days,
        initialAmount: +initialAmount!,
        type: type!,
      })
      .subscribe({
        next: (response) => {
          alert('DAP creado correctamente');
          console.log(response);
          this.router.navigate([ROUTE_TOKENS.CLIENT_PATH, ROUTE_TOKENS.DAP]);
          this.isSubmitting = false;
        },
        error: (error) => {
          alert('Ha ocurrido un error');
          this.isSubmitting = false;
          console.error(error);
        },
      });
  }

  fs(name: string): FormControl {
    return this.simulateFirstForm.get(name) as FormControl;
  }

  volver() {
  this.router.navigate(['/cliente/depositos-a-plazo']); 
  }
}
