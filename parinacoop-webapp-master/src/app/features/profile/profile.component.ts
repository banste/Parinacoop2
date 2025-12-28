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

  private lastProfileSnapshot: any = null; // para restaurar al cancelar edición

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
      .pipe(takeUntil(this.onDestroy$), filter((user) => !!user))
      .subscribe((user) => {
        const runNumber = Number((user as any).run);

        if (Number.isNaN(runNumber)) {
          this.loading = false;
          alert('RUN inválido en sesión');
          return;
        }

        // Subscribe local para rellenar formulario cuando ProfileService actualice userProfile$
        this.profileService.userProfile$
          .pipe(takeUntil(this.onDestroy$))
          .subscribe((profile) => {
            if (!profile) return;
            // guardamos snapshot para restaurar si el usuario cancela la edición
            this.lastProfileSnapshot = profile;
            this.patchForm(profile);
            this.profileForm.disable();
            this.loading = false;
            this.isEditing = false;
          });

        // Intentar cargar desde backend
        this.profileService.getCurrentProfile(runNumber).subscribe({
          next: () => {
            // getCurrentProfile actualizará userProfile$ y el subscriber lo rellenará
            this.loading = false;
          },
          error: (err) => {
            this.loading = false;
            if (err?.status === 404) {
              // Perfil no existe -> permitir crear desde UI
              this.profileForm.enable();
              this.isEditing = true;
              this.profileForm.controls['run'].setValue(String(runNumber));
              return;
            }
            alert('No se pudo cargar el perfil (revisa Network/Console).');
            console.error(err);
          },
        });
      });
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  // Helper para obtener FormControl en plantilla
  fc(name: string): FormControl {
    return this.profileForm.get(name) as FormControl;
  }

  // Toggle edit mode: si activamos edición habilitamos form; si cancelamos, restauramos valores
  toggleEdit(): void {
    if (!this.isEditing) {
      this.profileForm.enable();
      // proteger el campo run para que no sea editable (si prefieres que sea editable, quita la línea)
      this.profileForm.controls['run'].disable();
      this.isEditing = true;
      return;
    }

    // Si ya estaba en edición -> salir y restaurar valores previos
    this.isEditing = false;
    this.profileForm.disable();
    if (this.lastProfileSnapshot) {
      this.patchForm(this.lastProfileSnapshot);
    }
  }

  // Maneja el submit del formulario: arma DTO y llama al servicio
  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const dto: UpdateProfileDto = {
      run: Number(this.profileForm.value.run),
      documentNumber: Number(this.profileForm.value.documentNumber),
      names: String(this.profileForm.value.names),
      firstLastName: String(this.profileForm.value.firstLastName),
      secondLastName: String(this.profileForm.value.secondLastName),
      email: String(this.profileForm.value.email),
      cellphone: String(this.profileForm.value.cellphone),
      street: String(this.profileForm.value.street),
      number: Number(this.profileForm.value.number),
      detail: String(this.profileForm.value.detail ?? ''),
      regionId: Number(this.profileForm.value.regionId),
      communeId: Number(this.profileForm.value.communeId),
    };

    this.profileService.updateProfile(dto).subscribe({
      next: (res) => {
        alert('Perfil actualizado correctamente');
        // refrescar el perfil desde backend
        this.profileService.getCurrentProfile(dto.run).subscribe({
          next: () => {
            this.isSubmitting = false;
            this.profileForm.disable();
            this.isEditing = false;
          },
          error: (err) => {
            console.warn('No se pudo refrescar perfil tras actualizar', err);
            this.isSubmitting = false;
            this.profileForm.disable();
            this.isEditing = false;
          },
        });
      },
      error: (err) => {
        console.error('Error actualizando perfil', err);
        alert('Error al actualizar el perfil');
        this.isSubmitting = false;
      },
    });
  }

  // Llama al LocationService para cargar comunas de una región seleccionada
  getCommunes(regionId: number): void {
    if (!regionId) return;
    // Intentamos dos nombres comunes de método en LocationService por compatibilidad:
    const svc: any = this.locationService as any;
    if (typeof svc.getCommunesByRegionId === 'function') {
      svc.getCommunesByRegionId(regionId);
    } else if (typeof svc.getCommunes === 'function') {
      svc.getCommunes(regionId);
    } else {
      // último recurso: intentar exponer al observable communes$ para rellenar
      console.warn('LocationService no expone getCommunesByRegionId/getCommunes');
    }
  }

  // Rellena el formulario a partir del profile object devuelto desde el backend
  private patchForm(profile: any): void {
    this.profileForm.patchValue({
      run: String(profile.run ?? ''),
      documentNumber: profile.documentNumber ?? 0,
      names: profile.names ?? '',
      firstLastName: profile.firstLastName ?? '',
      secondLastName: profile.secondLastName ?? '',
      email: profile.email ?? '',
      cellphone: profile.cellphone ?? '',
      street: profile.street ?? '',
      number: profile.number ?? 0,
      detail: profile.detail ?? '',
      regionId: profile.regionId ?? 0,
      communeId: profile.communeId ?? 0,
    });

    // Si hay regionId, disparar fetch de comunas
    const reg = Number(profile.regionId ?? 0);
    if (reg > 0) {
      this.getCommunes(reg);
    }
  }
}