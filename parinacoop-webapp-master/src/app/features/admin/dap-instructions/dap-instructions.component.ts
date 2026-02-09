import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import {
  DapInstructionsService,
  DapInstructionsResponse,
} from './dap-instructions.service';

@Component({
  selector: 'app-dap-instructions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dap-instructions.component.html',
  styleUrls: ['./dap-instructions.component.scss'],
})
export class DapInstructionsComponent implements OnInit {
  loading = false;
  saving = false;
  errorMsg = '';
  successMsg = '';

  form: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: DapInstructionsService,
  ) {
    this.form = this.fb.group({
      bankName: ['', Validators.required],
      accountType: ['', Validators.required],
      accountNumber: ['', Validators.required],
      accountHolderName: ['', Validators.required],
      accountHolderRut: ['', Validators.required],
      email: [''],
      description: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  ngOnInit(): void {
    this.loading = true;
    this.errorMsg = '';
    this.successMsg = '';

    console.debug('DAP instructions: requesting GET /admin/dap-instructions');
    this.service
      .get()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data: DapInstructionsResponse) => {
          console.debug('DAP instructions GET result:', data);
          this.form.patchValue(data);
          // mark pristine so the form doesn't appear as "dirty" after patch
          this.form.markAsPristine();
        },
        error: (err) => {
          console.error('Error loading dap instructions', err);
          // intentar obtener un mensaje más claro si viene del backend
          this.errorMsg =
            err?.error?.message ??
            err?.message ??
            'No se pudo cargar la configuración de DAP.';
        },
      });
  }

  save(): void {
    // evitar doble submit si ya guardando o cargando
    if (this.saving || this.loading) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMsg = 'Formulario inválido. Revisa los campos requeridos.';
      return;
    }

    this.saving = true;
    this.errorMsg = '';
    this.successMsg = '';

    const payload = this.form.getRawValue() as DapInstructionsResponse;
    console.debug('DAP instructions: PUT payload=', payload);

    this.service
      .update(payload)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (data) => {
          console.debug('DAP instructions updated, response:', data);
          // patch con lo que devuelva el servidor (controller ya devuelve el valor guardado)
          if (data) {
            this.form.patchValue(data);
            this.form.markAsPristine();
          }
          this.successMsg = 'Configuración guardada';
          // limpiar el mensaje en 4s
          setTimeout(() => (this.successMsg = ''), 4000);
        },
        error: (err) => {
          console.error('Error saving dap instructions', err);
          this.errorMsg =
            err?.error?.message ??
            err?.message ??
            'No se pudo guardar la configuración de DAP.';
        },
      });
  }
}