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
import { Subject, Observable, takeUntil, filter, first } from 'rxjs';

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

  // Indica que el perfil no existe en backend (404). Usamos esto para no activar edición automática.
  profileMissing = false;

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

    // cargar regiones al inicio (LocationService se encarga de cachear)
    try {
      (this.locationService as any).getRegions?.();
    } catch {
      // noop
    }

    // 1) Pedir perfil con el run del usuario logueado
    this.authService.currentUser$
      .pipe(takeUntil(this.onDestroy$), filter((user) => !!user))
      .subscribe((user) => {
        const runNumber = Number((user as any).run);
        if (!runNumber || isNaN(runNumber)) {
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
            this.profileMissing = false;
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
              // Perfil no existe -> marcar profileMissing pero NO entrar en edición automáticamente.
              // El usuario podrá entrar a editar (crear) con el botón "Modificar perfil".
              this.profileMissing = true;
              // Pre-fill the run so user doesn't have to type it when creating profile
              this.profileForm.get('run')?.setValue(String(runNumber));
              // Keep the form disabled (view mode). Do NOT enable fields automatically.
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

  // Habilita TODOS los campos para edición excepto 'run'
  private enableEditableFields(): void {
    Object.keys(this.profileForm.controls).forEach((key) => {
      if (key === 'run') return; // run no es editable
      const ctrl = this.profileForm.get(key);
      ctrl?.enable();
      // actualizar validación al habilitar
      ctrl?.updateValueAndValidity({ onlySelf: true });
    });
  }

  // Deshabilita todos los controles (modo lectura total)
  private disableAllControls(): void {
    Object.keys(this.profileForm.controls).forEach((key) => {
      const c = this.profileForm.get(key);
      c?.disable();
    });
  }

  // Toggle edit mode: habilitar todos los campos salvo 'run'
  toggleEdit(): void {
    if (!this.isEditing) {
      // Si el perfil estaba faltando (creación), permitimos editar documentNumber también
      this.enableEditableFields();
      if (this.profileMissing) {
        this.profileForm.get('documentNumber')?.enable();
      }
      this.isEditing = true;
      return;
    }

    // cancelar edición -> restaurar snapshot y deshabilitar todo
    this.isEditing = false;
    if (this.lastProfileSnapshot) {
      this.patchForm(this.lastProfileSnapshot);
    } else if (this.profileMissing) {
      // limpiar si estábamos creando y no había snapshot
      this.profileForm.patchValue({
        documentNumber: '',
        names: '',
        firstLastName: '',
        secondLastName: '',
        email: '',
        cellphone: '',
        street: '',
        number: null,
        detail: '',
        regionId: 0,
        communeId: 0,
      });
    }
    this.disableAllControls();
  }

  // Rellena el formulario a partir del profile object devuelto desde el backend
  private patchForm(profile: any): void {
    // Mapear valores reales (no escribir "Vacio" en los controles)
    this.profileForm.patchValue({
      run: String(profile.run ?? ''),
      documentNumber: String(profile.documentNumber ?? ''),
      names: profile.names ?? '',
      firstLastName: profile.firstLastName ?? '',
      secondLastName: profile.secondLastName ?? '',
      email: profile.email ?? '',
      cellphone: profile.cellphone ?? '',
      // dirección: dejar en blanco si no existe; template mostrará placeholder "Vacio"
      street: profile.street ?? '',
      number: profile.number ?? null,
      detail: profile.detail ?? '',
      regionId: Number(profile.regionId ?? 0),
      communeId: Number(profile.communeId ?? 0),
    });

    // Si viene regionId > 0, cargar comunas y setear communeId cuando las comunas lleguen
    const regionId = Number(profile.regionId ?? 0);
    const communeId = Number(profile.communeId ?? 0);
    if (regionId && regionId > 0) {
      this.loadCommunesAndSet(regionId, communeId);
    } else {
      // limpiar comunas si no hay region
      try {
        (this.locationService as any).communesSubject?.next([]);
      } catch {
        // noop
      }
    }
  }

  // Carga comunas para una región y asigna communeId cuando la lista ya está cargada
  private loadCommunesAndSet(regionId: number, communeId: number): void {
    // Pedir comunas al backend
    this.locationService.getCommunesByRegionId(regionId);

    // Suscribirse una sola vez al stream de communes$ y setear communeId cuando haya datos
    this.communes$?.pipe(first()).subscribe((list) => {
      if (!list || list.length === 0) {
        // nada que asignar
        return;
      }
      // si communeId válido y está en la lista, setearlo; si no, dejar 0
      const exists = list.some((c) => Number(c.id) === Number(communeId));
      if (exists) {
        this.profileForm.get('communeId')?.setValue(Number(communeId));
      } else {
        // dejar 0 para que aparezca "Seleccione una comuna"
        this.profileForm.get('communeId')?.setValue(0);
      }
    });
  }

  // Helper para mostrar placeholder o valor para elementos de solo lectura.
  // Si control vacío y no estamos en edición devuelve 'Vacio', si está en edición devuelve '' (no placeholder).
  getPlaceholder(ctrlName: string, defaultText = 'Vacio'): string {
    const ctrl = this.profileForm.get(ctrlName);
    const val = ctrl?.value;
    if (!this.isEditing && (val === null || val === undefined || val === '')) return defaultText;
    return '';
  }

  // Devuelve una cadena para mostrar en spans de solo lectura (útil si usas <span>{{ getDisplayValue('street') }}</span>)
  getDisplayValue(ctrlName: string, defaultText = 'Vacio'): string {
    const ctrl = this.profileForm.get(ctrlName);
    const val = ctrl?.value;
    if (val === null || val === undefined || val === '') return defaultText;
    return String(val);
  }

  // -----------------------------
  // MÉTODOS DE ENVÍO Y UTILIDAD
  // -----------------------------

  // Método invocado por (submit)="onSubmit()" en la plantilla
  onSubmit(): void {
    // Al enviar validamos todo el formulario (excepto run que está deshabilitado)
    if (this.profileForm.invalid) {
      alert('Formulario inválido. Revisa los campos requeridos.');
      return;
    }

    // Construir DTO para el backend
    const dto: UpdateProfileDto = {
      run: Number(this.profileForm.get('run')?.value),
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

    this.isSubmitting = true;
    this.profileService.updateProfile(dto).subscribe({
      next: (res) => {
        // actualizamos snapshot y deshabilitamos edición
        this.lastProfileSnapshot = {
          ...dto,
        };
        this.disableAllControls();
        this.isEditing = false;
        this.isSubmitting = false;
        this.profileMissing = false;
        // recargar perfil desde el servicio para notificar otros subscriptores
        this.profileService.getCurrentProfile(dto.run).subscribe({
          next: () => {
            // opcional: mostrar mensaje
          },
          error: () => {
            // noop
          },
        });
      },
      error: (err) => {
        console.error('updateProfile error', err);
        this.isSubmitting = false;
        alert('No se pudo actualizar el perfil. Revisa la consola y la red.');
      },
    });
  }

  // Método invocado por (selectionChange)="getCommunes($event.value)" — carga comunas para la región seleccionada
  getCommunes(regionId: number): void {
    if (!regionId || regionId <= 0) {
      // limpiar comunas si region inválida
      try {
        (this.locationService as any).communesSubject?.next([]);
      } catch {
        // noop si no existe internamente
      }
      return;
    }
    // Llama al service para poblar communes$
    this.locationService.getCommunesByRegionId(regionId);
  }
}