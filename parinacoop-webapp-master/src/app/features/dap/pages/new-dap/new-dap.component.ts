import { take, Observable, Subject } from 'rxjs';
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
import { DapService } from '../../dap.service';
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
    private dapService: DapService,
  ) {}

  ngOnInit(): void {
    this.termOptions$ = this.newDapService.termOptions$;

    // Tomar el user una sola vez al iniciar (evita bloquear si ya hay token)
    this.authService.currentUser$.pipe(take(1)).subscribe((user) => {
      if (user) {
        this.userRun = user.run;
      }
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
    if (this.simulateFirstForm.invalid || this.simulateSecondForm.invalid) {
      return;
    }

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
          console.log('DAP creado correctamente', response);

          // Refrescar la lista en el servicio para que el componente destino
          // que usa daps$ reciba el nuevo valor.
          try {
            if (this.userRun) {
              this.dapService.getDapList(this.userRun);
            }
          } catch (err) {
            console.warn('No se pudo refrescar lista de DAPs:', err);
          }

          // Navegación absoluta para evitar duplicar /cliente
          const target = `/${ROUTE_TOKENS.CLIENT_PATH}/${ROUTE_TOKENS.DAP}`;

          // Pequeño retraso para asegurar que el subject emite antes de renderizar
          setTimeout(() => {
            this.router.navigateByUrl(target).then((ok) => {
              console.log('Navigation result:', ok, 'to', target);
              if (!ok) {
                console.warn('Navigation failed, forcing full reload to', target);
                window.location.href = target;
              }
            });
          }, 150);

          this.isSubmitting = false;
        },
        error: (error) => {
          alert('Ha ocurrido un error');
          this.isSubmitting = false;
          console.error('Error creando DAP:', error);
        },
      });
  }

  fs(name: string): FormControl {
    return this.simulateFirstForm.get(name) as FormControl;
  }
}