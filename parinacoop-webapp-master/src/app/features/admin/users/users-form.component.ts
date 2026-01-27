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
import { AdminUser } from './user.model';
import { SvgIconComponent } from '@app/shared/components';

@Component({
  selector: 'app-admin-users-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, SvgIconComponent],
  templateUrl: './users-form.component.html',
})
export default class UsersFormComponent implements OnInit {
  form!: FormGroup;
  saving = false;
  error = '';
  isEdit = false;
  userId?: number;

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
            run: u.run ?? '',
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

    const rawValues = this.form.value;

    // Normalizar RUN -> extraemos sólo dígitos y lo dejamos como string
    const rawRun = String(rawValues.run ?? '');
    const runDigits = rawRun.replace(/\D/g, '').trim(); // '20218321' o ''

    const payload: Partial<AdminUser> = {
      name: rawValues.name !== null && rawValues.name !== undefined ? String(rawValues.name).trim() : undefined,
      // Enviamos run como string (o undefined si vacío)
      run: runDigits !== '' ? runDigits : undefined,
      email:
        rawValues.email !== null && rawValues.email !== undefined
          ? (rawValues.email ? String(rawValues.email).trim() : undefined)
          : undefined,
      role: rawValues.role !== null && rawValues.role !== undefined ? String(rawValues.role).trim() : undefined,
      active: typeof rawValues.active === 'boolean' ? rawValues.active : undefined,
    };

    if (this.isEdit && this.userId) {
      this.svc.update(this.userId, payload).subscribe({
        next: () => this.router.navigate(['/admin/usuarios']),
        error: (err) => {
          console.error('update user', err);
          this.error = 'Error al actualizar usuario';
          this.saving = false;
        },
      });
    } else {
      this.svc.create(payload).subscribe({
        next: () => this.router.navigate(['/admin/usuarios']),
        error: (err) => {
          console.error('create user', err);
          this.error = 'Error al crear usuario';
          this.saving = false;
        },
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/usuarios']);
  }
}