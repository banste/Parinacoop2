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

    this.service
      .get()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data: DapInstructionsResponse) => this.form.patchValue(data),
        error: () =>
          (this.errorMsg = 'No se pudo cargar la configuración de DAP.'),
      });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.errorMsg = '';

    this.service
      .update(this.form.getRawValue() as DapInstructionsResponse)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (data) => this.form.patchValue(data),
        error: () =>
          (this.errorMsg = 'No se pudo guardar la configuración de DAP.'),
      });
  }
}
