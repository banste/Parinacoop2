import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AsyncPipe, NgClass } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { filter, Observable, Subject, takeUntil } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

import { Commune } from '@features/profile/models/Commune';
import { runValidator } from '@shared/validators/runValidator';
import { FormFieldComponent, SpinnerComponent } from '@shared/components';

import { ProfileService } from './services/profile.service';
import { Region } from './models/Region';
import { LocationService } from './services/location.service';
import {
  formatRut,
  getRutDigits,
  RutFormat,
  calculateRutVerifier,
} from '@fdograph/rut-utilities';
import { UpdateProfileDto } from './interfaces/update-profile.dto';
import { AuthService } from '@app/core/auth/services/auth.service';

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
    run: new FormControl('', [Validators.required, runValidator]),
    names: new FormControl('', Validators.required),
    firstLastName: new FormControl('', Validators.required),
    secondLastName: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    documentNumber: new FormControl(0, Validators.required),
    cellphone: new FormControl('', Validators.required),
    street: new FormControl('', Validators.required),
    number: new FormControl(0, Validators.required),
    detail: new FormControl(''),
    regionId: new FormControl(0, [Validators.min(1)]),
    communeId: new FormControl(0, [Validators.min(1)]),
  });

  regions$?: Observable<Region[]>;
  communes$?: Observable<Commune[]>;
  onDestroy$ = new Subject<void>();

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

    this.authService.currentUser$
      .pipe(
        takeUntil(this.onDestroy$),
        filter((user) => user !== null),
      )
      .subscribe((user) => this.profileService.getCurrentProfile(user.run));

    this.profileService.userProfile$
      .pipe(takeUntil(this.onDestroy$))
      .subscribe({
        next: (data) => {
          if (data) {
            console.log(data.run);
            const runDigits = `${data.run}${calculateRutVerifier(data.run.toString())}`;
            this.profileForm.patchValue({
              ...data,
              run: formatRut(runDigits, RutFormat.DOTS_DASH),
            });
            this.loading = false;
            this.getRegions();
            this.getCommunes(data.regionId);
          }
        },
      });
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  onSubmit(): void {
    if (this.profileForm.invalid) return;
    this.isSubmitting = true;
    this.profileForm.disable();
    const profileValue = this.profileForm.value;

    const newData: UpdateProfileDto = {
      run: +getRutDigits(this.fc('run').value),
      documentNumber: profileValue.documentNumber!,
      names: profileValue.names!,
      firstLastName: profileValue.firstLastName!,
      secondLastName: profileValue.secondLastName!,
      email: profileValue.email!,
      cellphone: profileValue.cellphone!,
      street: profileValue.street!,
      number: profileValue.number!,
      detail: profileValue.detail!,
      regionId: profileValue.regionId!,
      communeId: profileValue.communeId!,
    };

    this.profileService.updateProfile(newData).subscribe({
      next: (response) => {
        alert(response.msg);
        this.isSubmitting = false;
        this.isEditing = false;
      },
      error: (error) => {
        alert('Error al actualizar el perfil');
        console.error(error);
        this.isSubmitting = false;
        this.profileForm.enable();
      },
    });
  }

  toggleEdit(): void {
    if (this.isEditing) {
      this.profileForm.disable();
      this.profileService.resetProfile();
    } else {
      this.profileForm.enable();
    }
    this.isEditing = !this.isEditing;
  }

  getRegions(): void {
    this.locationService.getRegions();
  }

  getCommunes(regionId: number): void {
    console.log(regionId);
    this.locationService.getCommunesByRegionId(regionId);
  }

  fc(name: string): FormControl {
    return this.profileForm.get(name) as FormControl;
  }
}
