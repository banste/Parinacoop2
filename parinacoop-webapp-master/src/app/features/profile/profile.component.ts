import {
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AsyncPipe, NgClass } from '@angular/common';
import { Subject, Observable, takeUntil, filter } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { FormFieldComponent } from '@app/shared/components/form-field/form-field.component';
import { SpinnerComponent } from '@app/shared/components/spinner/spinner.component';

import { LocationService } from './services/location.service';
import { AuthService } from '@app/core/auth/services/auth.service';
import { ProfileService } from './services/profile.service';
import { UpdateProfileDto } from './interfaces/update-profile.dto';

import { Commune } from './models/Commune';
import { Region } from './models/Region';

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
    run: new FormControl<string>('', [Validators.required /*, runValidator si lo usas */]),
    names: new FormControl<string>('', Validators.required),
    firstLastName: new FormControl<string>('', Validators.required),
    secondLastName: new FormControl<string>('', Validators.required),
    email: new FormControl<string>('', [Validators.required, Validators.email]),
    // documentNumber como string: acepta letras, números, puntos y guiones
    documentNumber: new FormControl<string>('', [
      Validators.required,
      Validators.minLength(3),
      Validators.pattern(/^[A-Za-z0-9.\-]+$/),
    ]),
    cellphone: new FormControl<string>('', Validators.required),
    street: new FormControl<string>('', Validators.required),
    number: new FormControl<number | null>(null, Validators.required),
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

  // Campos que permitimos editar (contacto y dirección)
  private readonly editableFields = [
    'email',
    'cellphone',
    'street',
    'number',
    'detail',
    'regionId',
    'communeId',
  ];

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
            // siempre mostrar en modo lectura por defecto
            this.disableAllControls();
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
              // Habilitar campos editables + documentNumber (usuario debe ingresarlo)
              this.enableEditableFields();
              this.profileForm.get('documentNumber')?.enable();
              this.isEditing = true;
              this.profileForm.get('run')?.setValue(String(runNumber));
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

  // Habilita SOLO los campos de contacto/dirección
  private enableEditableFields(): void {
    // Habilitar solo los editables definidos
    this.editableFields.forEach((f) => {
      const ctrl = this.profileForm.get(f);
      ctrl?.enable();
    });
    // mantener datos personales deshabilitados por defecto
    this.profileForm.get('run')?.disable();
    this.profileForm.get('names')?.disable();
    this.profileForm.get('firstLastName')?.disable();
    this.profileForm.get('secondLastName')?.disable();
    // documentNumber lo dejamos deshabilitado por defecto; en flujo de creación se habilita explícitamente
    this.profileForm.get('documentNumber')?.disable();
  }

  // Deshabilita todos los controles (modo lectura total)
  private disableAllControls(): void {
    Object.keys(this.profileForm.controls).forEach((key) => {
      const c = this.profileForm.get(key);
      c?.disable();
    });
  }

  // Toggle edit mode: al entrar habilitamos solo campos editables
  toggleEdit(): void {
    if (!this.isEditing) {
      this.enableEditableFields();
      // si quieres que al hacer click en "Modificar" también permita editar documentNumber:
      // this.profileForm.get('documentNumber')?.enable();
      this.isEditing = true;
      return;
    }

    // si ya estaba en edición -> cancelar y restaurar snapshot
    this.isEditing = false;
    this.disableAllControls();
    if (this.lastProfileSnapshot) {
      this.patchForm(this.lastProfileSnapshot);
    }
  }

  // Rellena el formulario a partir del profile object devuelto desde el backend
  private patchForm(profile: any): void {
    this.profileForm.patchValue({
      run: String(profile.run ?? ''),
      // documentNumber como string; usar '' si no viene
      documentNumber: profile.documentNumber ?? '',
      names: profile.names ?? '',
      firstLastName: profile.firstLastName ?? '',
      secondLastName: profile.secondLastName ?? '',
      email: profile.email ?? '',
      cellphone: profile.cellphone ?? '',
      street: profile.street ?? '',
      number: profile.number ?? null,
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

  // Maneja el submit del formulario: arma DTO y llama al servicio
  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      alert('Corrige los errores del formulario antes de enviar.');
      return;
    }

    this.isSubmitting = true;

    const dto: UpdateProfileDto = {
      run: Number(this.profileForm.get('run')?.value ?? 0),
      // enviar documentNumber como string tal y como está en el form
      documentNumber: String(this.profileForm.get('documentNumber')?.value ?? ''),
      names: String(this.profileForm.get('names')?.value ?? ''),
      firstLastName: String(this.profileForm.get('firstLastName')?.value ?? ''),
      secondLastName: String(this.profileForm.get('secondLastName')?.value ?? ''),
      email: String(this.profileForm.get('email')?.value ?? ''),
      cellphone: String(this.profileForm.get('cellphone')?.value ?? ''),
      street: String(this.profileForm.get('street')?.value ?? ''),
      number: Number(this.profileForm.get('number')?.value ?? 0),
      detail: String(this.profileForm.get('detail')?.value ?? ''),
      regionId: Number(this.profileForm.get('regionId')?.value ?? 0),
      communeId: Number(this.profileForm.get('communeId')?.value ?? 0),
    };

    this.profileService.updateProfile(dto).subscribe({
      next: () => {
        alert('Perfil actualizado correctamente');
        // refrescar el perfil desde backend
        this.profileService.getCurrentProfile(dto.run).subscribe({
          next: () => {
            this.isSubmitting = false;
            this.disableAllControls();
            this.isEditing = false;
          },
          error: (err) => {
            console.warn('No se pudo refrescar perfil tras actualizar', err);
            this.isSubmitting = false;
            this.disableAllControls();
            this.isEditing = false;
          },
        });
      },
      error: (err) => {
        console.error('Error actualizando perfil', err);
        const serverMsg = err?.error ?? err;
        alert(`Error al actualizar el perfil: ${JSON.stringify(serverMsg)}`);
        this.isSubmitting = false;
      },
    });
  }

  // Llama al LocationService para cargar comunas de una región seleccionada
  getCommunes(regionId: number): void {
    if (!regionId) return;
    const svc: any = this.locationService as any;
    if (typeof svc.getCommunesByRegionId === 'function') {
      svc.getCommunesByRegionId(regionId);
    } else if (typeof svc.getCommunes === 'function') {
      svc.getCommunes(regionId);
    } else {
      console.warn('LocationService no expone getCommunesByRegionId/getCommunes');
    }
  }
}