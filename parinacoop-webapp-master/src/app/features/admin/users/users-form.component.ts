import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AdminUsersService } from './admin-users.service';
import { getRutDigits } from '@fdograph/rut-utilities';
import { AdminUser } from './user.model';

@Component({
  selector: 'app-admin-users-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './users-form.component.html',
})
export default class UsersFormComponent implements OnInit {
  form!: FormGroup;
  saving = false;
  error = '';
  isEdit = false;
  userId?: number;

  // Debugging helpers
  lastSentPayload: any = null;
  sentAt?: string;
  lastResponse?: any;
  showDebug = true;

  constructor(
    private fb: FormBuilder,
    private svc: AdminUsersService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      run: ['', [Validators.required]],
      email: ['', [Validators.email]],
      role: ['', [Validators.required]],
      active: [true],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.userId = Number(id);
      this.svc.get(this.userId).subscribe({
        next: (u) => {
          this.form.patchValue({
            name: u.name ?? '',
            run: u.run != null ? String(u.run) : '',
            email: u.email ?? '',
            role: u.role ?? '',
            active: !!u.active,
          });
        },
        error: (err) => {
          console.error('get user', err);
          this.error = 'No se pudo cargar usuario';
        },
      });
    }
  }

  fc(name: string): AbstractControl {
    return this.form.get(name) as AbstractControl;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = '';
    this.lastResponse = undefined;

    const rawValues = this.form.value;

    // Normalizar RUN -> solo dígitos; convertir a Number o undefined
    const runDigits = String(getRutDigits(String(rawValues.run ?? '')) ?? '').trim();
    const runValue: number | undefined = runDigits !== '' ? Number(runDigits) : undefined;

    // Construir payload usando undefined para campos no enviados (coincide con Partial<AdminUser>)
    const payload: Partial<AdminUser> = {
      name: rawValues.name !== null && rawValues.name !== undefined ? String(rawValues.name).trim() : undefined,
      run: runValue,
      email:
        rawValues.email !== null && rawValues.email !== undefined
          ? (rawValues.email ? String(rawValues.email).trim() : undefined)
          : undefined,
      role: rawValues.role !== null && rawValues.role !== undefined ? String(rawValues.role).trim() : undefined,
      active: typeof rawValues.active === 'boolean' ? rawValues.active : undefined,
    };

    // Guardamos la "flag" / payload que vamos a enviar para debugging
    this.lastSentPayload = payload;
    this.sentAt = new Date().toISOString();

    // DEBUG consola
    console.log('[DEBUG frontend] payload to send:', payload, 'sentAt=', this.sentAt);

    if (this.isEdit && this.userId) {
      this.svc.update(this.userId, payload).subscribe({
        next: (res) => {
          this.lastResponse = res;
          this.saving = false;
          this.router.navigate(['/admin/usuarios']);
        },
        error: (err) => {
          console.error('update user', err);
          this.error = 'Error al actualizar usuario';
          this.lastResponse = err;
          this.saving = false;
        },
      });
    } else {
      this.svc.create(payload).subscribe({
        next: (res) => {
          this.lastResponse = res;
          this.saving = false;
          this.router.navigate(['/admin/usuarios']);
        },
        error: (err) => {
          console.error('create user', err);
          this.error = 'Error al crear usuario';
          this.lastResponse = err;
          this.saving = false;
        },
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/usuarios']);
  }

  // Toggle del panel de depuración
  toggleDebug(): void {
    this.showDebug = !this.showDebug;
  }
}