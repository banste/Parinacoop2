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
  form!: FormGroup; // creado en el constructor
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
    // Crear form aquí, cuando fb ya está disponible
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
          // Normalizar valores al formulario (convertir a string donde corresponde)
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

  // Helper para usar en plantilla: fc('name')
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

    // Extraer y normalizar RUN -> solo dígitos (Number) ; si prefieres string quita Number()
    const runDigits = String(getRutDigits(String(rawValues.run ?? '')) ?? '').trim();
    const runValue = runDigits !== '' ? Number(runDigits) : undefined;

    const payload: Partial<AdminUser> = {
      name: rawValues.name ?? undefined,
      run: runValue,
      email: rawValues.email ? String(rawValues.email).trim() : undefined,
      role: rawValues.role ? String(rawValues.role).trim() : undefined,
      active: typeof rawValues.active === 'boolean' ? rawValues.active : true,
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