import { Component, OnDestroy, OnInit } from '@angular/core';
import { AsyncPipe, NgClass } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { Observable, Subject, filter, takeUntil } from 'rxjs';

import { runValidator } from '@shared/validators/runValidator';
import { FormFieldComponent, SpinnerComponent } from '@shared/components';

import { AuthService } from '@app/core/auth/services/auth.service';
import { LocationService } from './services/location.service';
import { ProfileService } from './services/profile.service';
import { Region } from './models/Region';
import { Commune } from '@features/profile/models/Commune';

import {
  formatRut,
  getRutDigits,
  RutFormat,
  calculateRutVerifier,
} from '@fdograph/rut-utilities';

import { UpdateProfileDto } from './interfaces/update-profile.dto';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonModule,
    FormFieldComponent,
    MatSelectModule,
    MatIconModule,
    NgClass,
    AsyncPipe,
    SpinnerComponent,
  ],
  templateUrl: './profile.component.html',
})
export default class ProfileComponent implements OnInit, OnDestroy {
  profileForm = new FormGroup({
    run: new FormControl<string>('', [Validators.required, runValidator]),
    names: new FormControl<string>('', Validators.required),
    firstLastName: new FormControl<string>('', Validators.required),
    secondLastName: new FormControl<string>('', Validators.required),
    email: new FormControl<string>('', [Validators.required, Validators.email]),
    documentNumber: new FormControl<number>(0, Validators.required),
    cellphone: new FormControl<string>('', Validators.required),
    street: new FormControl<string>('', Validators.required),
    number: new FormControl<number>(0, Validators.required),
    detail: new FormControl<string>(''),
    regionId: new FormControl<number>(0, [Validators.min(1)]),
    communeId: new FormControl<number>(0, [Validators.min(1)]),
  });

  regions$?: Observable<Region[]>;
  communes$?: Observable<Commune[]>;
  private onDestroy$ = new Subject<void>();

  loading = false;
  isEditing = false;
  isSubmitting = false;

  constructor(
    private authService: AuthService,
    private profileService: ProfileService,
    private locationService: LocationService,
  ) {}

  ngOnInit(): void {
    this.profileForm.disable();
    this.loading = true;

    this.regions$ = this.locationService.regions$;
    this.communes$ = this.locationService.communes$;

    // 1) Pedir perfil con el run del usuario logueado
    this.authService.currentUser$
  .pipe(
    takeUntil(this.onDestroy$),
    filter((user) => !!user),
  )
  .subscribe((user) => {
    const runNumber = Number((user as any).run);

    if (Number.isNaN(runNumber)) {
      this.loading = false;
      alert('RUN inválido en sesión');
      return;
    }

    this.profileService.getCurrentProfile(runNumber).subscribe({
      next: () => {},
      error: () => {
        this.loading = false;
        alert('No se pudo cargar el perfil (revisa Network/Console).');
      },
    });
  });


    // 2) Cuando llega el perfil, rellenar formulario
    this.profileService.userProfile$
      .pipe(takeUntil(this.onDestroy$))
      .subscribe((data) => {
        if (!data) return;

        const runNumber = Number(data.run);
        const runDigits = `${runNumber}${calculateRutVerifier(String(runNumber))}`;

        this.profileForm.patchValue({
          ...data,
          run: formatRut(runDigits, RutFormat.DOTS_DASH),
        });

        this.loading = false;

        // Cargar combos
        this.getRegions();
        if (data.regionId) this.getCommunes(Number(data.regionId));
      });
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  toggleEdit(): void {
    if (this.isEditing) {
      this.profileForm.disable();
      // opcional: recargar perfil para “cancelar cambios”
      const run = Number(getRutDigits(String(this.fc('run').value ?? '')));
      if (!Number.isNaN(run)) this.profileService.getCurrentProfile(run).subscribe();
    } else {
      this.profileForm.enable();
      // Mantener RUN deshabilitado si no quieres que lo editen
      this.fc('run').disable();
    }
    this.isEditing = !this.isEditing;
  }

  onSubmit(): void {
    if (this.profileForm.invalid) return;

    this.isSubmitting = true;
    this.profileForm.disable();

    const run = Number(getRutDigits(String(this.fc('run').value ?? '')));

    const documentNumber = Number(this.fc('documentNumber').value);
    const number = Number(this.fc('number').value);
    const regionId = Number(this.fc('regionId').value);
    const communeId = Number(this.fc('communeId').value);

    if ([run, documentNumber, number, regionId, communeId].some(Number.isNaN)) {
      alert('Hay campos numéricos inválidos (NaN).');
      this.isSubmitting = false;
      this.profileForm.enable();
      this.fc('run').disable();
      return;
    }

    const newData: UpdateProfileDto = {
      run,
      documentNumber,
      names: String(this.fc('names').value ?? ''),
      firstLastName: String(this.fc('firstLastName').value ?? ''),
      secondLastName: String(this.fc('secondLastName').value ?? ''),
      email: String(this.fc('email').value ?? ''),
      cellphone: String(this.fc('cellphone').value ?? ''),
      street: String(this.fc('street').value ?? ''),
      number,
      detail: String(this.fc('detail').value ?? ''),
      regionId,
      communeId,
    };

    console.log('PATCH body:', newData);

    this.profileService.updateProfile(newData).subscribe({
      next: (response) => {
        alert(response.msg);
        this.isSubmitting = false;
        this.isEditing = false;
        // Recargar perfil para reflejar cambios
        this.profileService.getCurrentProfile(run).subscribe();
      },
      error: (error) => {
        console.error(error);
        alert('Error al actualizar el perfil');
        this.isSubmitting = false;
        this.profileForm.enable();
        this.fc('run').disable();
      },
    });
  }

  getRegions(): void {
    this.locationService.getRegions();
  }

  getCommunes(regionId: number): void {
    this.locationService.getCommunesByRegionId(regionId);
  }

  fc(name: string): FormControl {
    return this.profileForm.get(name) as FormControl;
  }
}
