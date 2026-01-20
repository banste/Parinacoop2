// src/app/core/auth/pages/register/register.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, AsyncPipe, NgClass } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { FormFieldComponent, SpinnerComponent } from '@app/shared/components';
import { LocationService } from '@app/features/profile/services/location.service';

// Si usas la directiva groupEvery3, mantenla importada; si no, puedes quitarla.
import { GroupEvery3Directive } from '@app/shared/directives/group-every-3.directive';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    FormFieldComponent,
    SpinnerComponent,
    NgClass,
    AsyncPipe,
    GroupEvery3Directive,
  ],
})
export default class RegisterComponent implements OnInit, OnDestroy {
  registerForm!: FormGroup;
  isSubmitting = false;
  registerErrorMsg = '';

  regions$?: Observable<any[]>;
  communes$?: Observable<any[]>;

  private subs = new Subscription();

  constructor(private fb: FormBuilder, private http: HttpClient, private locationService: LocationService) {}

  ngOnInit(): void {
    // Inicializar formulario
    this.registerForm = this.fb.group({
      // Información personal
      names: ['', Validators.required],
      firstLastName: ['', Validators.required],
      secondLastName: [''],
      run: ['', Validators.required],
      documentNumber: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      cellphone: ['', Validators.required],

      // Address
      typeAddress: ['home', Validators.required],
      street: ['', Validators.required],
      number: [null, Validators.required],
      detail: [''],

      // Region / Commune
      regionId: [0, Validators.min(0)],
      communeId: [0, Validators.min(0)],

      // Password / terms
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
      terms: [false, Validators.requiredTrue],
    });

    // Observables desde LocationService (LocationService tiene regions$ y communes$)
    this.regions$ = (this.locationService as any).regions$ as Observable<any[]>;
    this.communes$ = (this.locationService as any).communes$ as Observable<any[]>;

    // Cargar regiones al inicio (si el service provee getRegions)
    try {
      (this.locationService as any).getRegions?.();
    } catch {
      // noop
    }

    // Suscribirse a cambios de región para cargar comunas
    const regionCtrl = this.registerForm.get('regionId');
    if (regionCtrl) {
      const s = regionCtrl.valueChanges.pipe(distinctUntilChanged()).subscribe((val: any) => {
        const regionId = Number(val || 0);
        // resetear comuna al cambiar región
        this.registerForm.get('communeId')?.setValue(0);

        if (regionId > 0) {
          // llamar al servicio para cargar comunas de la región seleccionada
          try {
            const svc: any = this.locationService as any;
            if (typeof svc.getCommunesByRegionId === 'function') {
              svc.getCommunesByRegionId(regionId);
            } else if (typeof svc.getCommunes === 'function') {
              svc.getCommunes(regionId);
            } else {
              console.warn('LocationService no expone getCommunesByRegionId/getCommunes');
            }
          } catch (e) {
            console.warn('Error llamando a getCommunesByRegionId', e);
          }
        } else {
          // Si regionId === 0, opcional: podríamos limpiar la lista de comunas si el servicio lo permite
          // (no hacemos nada aquí porque communes$ se actualizará por el servicio si implementado).
        }
      });

      this.subs.add(s);
    }

    // Formateo automático del documentNumber (cada 3 caracteres) (valueChanges)
    const docCtrl = this.registerForm.get('documentNumber') as FormControl | null;
    if (docCtrl) {
      const s2 = docCtrl.valueChanges.pipe(distinctUntilChanged()).subscribe((val: any) => {
        if (val == null) return;
        const raw = String(val).replace(/\./g, '');
        const formatted = raw.replace(/(.{3})/g, '$1.').replace(/\.$/, '');
        if (formatted !== val) {
          docCtrl.setValue(formatted, { emitEvent: false });
        }
      });
      this.subs.add(s2);
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // Helper to access controls from template
  fc(name: string): FormControl {
    return this.registerForm.get(name) as FormControl;
  }

  // Registrarse
  onRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.registerErrorMsg = 'Corrige los errores del formulario antes de enviar.';
      return;
    }

    this.isSubmitting = true;
    this.registerErrorMsg = '';

    const payload = {
      run: String(this.fc('run').value),
      documentNumber: String(this.fc('documentNumber').value),
      names: String(this.fc('names').value),
      firstLastName: String(this.fc('firstLastName').value),
      secondLastName: String(this.fc('secondLastName').value ?? ''),
      email: String(this.fc('email').value),
      cellphone: String(this.fc('cellphone').value),
      password: String(this.fc('password').value),
      address: {
        typeAddress: String(this.fc('typeAddress').value),
        street: String(this.fc('street').value),
        number: Number(this.fc('number').value),
        detail: String(this.fc('detail').value ?? ''),
        communeId: Number(this.fc('communeId').value ?? 0),
      },
      regionId: Number(this.fc('regionId').value ?? 0),
      communeId: Number(this.fc('communeId').value ?? 0),
    };

    const url = 'auth/register'; // ajusta si tu API usa otro prefijo

    this.http.post(url, payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        alert('Registro exitoso');
        this.registerForm.reset({
          typeAddress: 'home',
          regionId: 0,
          communeId: 0,
          terms: false,
        });
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('register error', err);
        this.registerErrorMsg = (err?.error?.message as string) ?? 'Error registrando usuario';
      },
    });
  }
}