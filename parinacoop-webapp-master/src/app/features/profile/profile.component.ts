import { Component, OnDestroy, OnInit } from '@angular/core';
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

import { ProfileBankAccountService, UpsertBankAccountPayload } from './services/bank-account.service';

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
  styleUrls: ['./profile.component.scss'], // ✅ NEW
})
export default class ProfileComponent implements OnInit, OnDestroy {
  // (el resto de tu archivo TS queda igual al que ya tienes con bankForm)
  profileForm = new FormGroup({
    run: new FormControl<string>('', [Validators.required]),
    names: new FormControl<string>('', Validators.required),
    firstLastName: new FormControl<string>('', Validators.required),
    secondLastName: new FormControl<string>('', Validators.required),
    email: new FormControl<string>('', [Validators.required, Validators.email]),
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

  bankForm = new FormGroup({
    rutOwner: new FormControl<string>('', [Validators.required, Validators.maxLength(20)]),
    bankCode: new FormControl<string>('', [Validators.required, Validators.maxLength(20)]),
    bankName: new FormControl<string>('', [Validators.required, Validators.maxLength(100)]),
    accountType: new FormControl<string>('', [Validators.required, Validators.maxLength(30)]),
    accountNumber: new FormControl<string>('', [Validators.required, Validators.maxLength(30)]),
    email: new FormControl<string>('', [Validators.maxLength(150)]),
  });

  regions$?: Observable<Region[]>;
  communes$?: Observable<Commune[]>;
  private onDestroy$ = new Subject<void>();

  loading = false;
  isEditing = false;
  isSubmitting = false;

  profileMissing = false;
  private lastProfileSnapshot: any = null;

  bankLoading = false;
  bankSaving = false;
  bankEditing = false;
  bankHasAccount = false;
  bankError = '';
  bankSuccess = '';
  private lastBankSnapshot: any = null;

  private currentRun = 0;

  constructor(
    private authService: AuthService,
    private profileService: ProfileService,
    private locationService: LocationService,
    private bankSvc: ProfileBankAccountService,
  ) {}

  ngOnInit(): void {
    this.profileForm.disable();
    this.bankForm.disable();

    this.loading = true;
    this.regions$ = this.locationService.regions$;
    this.communes$ = this.locationService.communes$;

    try {
      (this.locationService as any).getRegions?.();
    } catch {}

    this.authService.currentUser$
      .pipe(
        takeUntil(this.onDestroy$),
        filter((u) => !!u),
      )
      .subscribe((u: any) => {
        const run = Number(u?.run ?? 0);
        this.currentRun = run;

        this.loadProfile(run);
        this.loadBankAccount(run);
      });
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  fc(name: string) {
    return this.profileForm.get(name) as FormControl;
  }
  bankFc(name: string) {
    return this.bankForm.get(name) as FormControl;
  }

  // ===== PERFIL (igual que antes) =====
  private loadProfile(run: number) {
    if (!run) {
      this.loading = false;
      return;
    }

    this.loading = true;
    this.profileMissing = false;

    this.profileService.getCurrentProfile(run).subscribe({
      next: (profile) => {
        this.profileForm.patchValue({
          run: String(profile.run ?? run),
          names: profile.names ?? '',
          firstLastName: profile.firstLastName ?? '',
          secondLastName: profile.secondLastName ?? '',
          email: profile.email ?? '',
          documentNumber: profile.documentNumber ?? '',
          cellphone: profile.cellphone ?? '',
          street: profile.street ?? '',
          number: profile.number ?? null,
          detail: profile.detail ?? '',
          regionId: profile.regionId ?? 0,
          communeId: profile.communeId ?? 0,
        });

        this.lastProfileSnapshot = this.profileForm.getRawValue();

        this.profileForm.disable();
        this.isEditing = false;
        this.isSubmitting = false;
        this.loading = false;

        const regionId = Number(profile.regionId ?? 0);
        if (regionId) {
          try {
            (this.locationService as any).getCommunesByRegionId?.(regionId);
          } catch {}
        }
      },
      error: (err: any) => {
        console.error('get profile error', err);
        this.loading = false;

        if (err?.status === 404) {
          this.profileMissing = true;
          this.profileForm.disable();
          this.isEditing = false;
          return;
        }

        alert(err?.error?.message ?? err?.message ?? 'Error cargando perfil');
      },
    });
  }

  toggleEdit(): void {
    if (this.isEditing) {
      if (this.lastProfileSnapshot) this.profileForm.reset(this.lastProfileSnapshot);
      this.profileForm.disable();
      this.isEditing = false;
      return;
    }

    this.isEditing = true;
    this.profileForm.enable();
    this.fc('run').disable();
  }

  onSubmit(): void {
    if (this.profileForm.invalid) return;

    const raw = this.profileForm.getRawValue();
    const dto: UpdateProfileDto = {
      run: Number(raw.run ?? this.currentRun),
      documentNumber: String(raw.documentNumber ?? ''),
      names: String(raw.names ?? ''),
      firstLastName: String(raw.firstLastName ?? ''),
      secondLastName: String(raw.secondLastName ?? ''),
      email: String(raw.email ?? ''),
      cellphone: String(raw.cellphone ?? ''),
      street: String(raw.street ?? ''),
      number: Number(raw.number ?? 0),
      detail: String(raw.detail ?? ''),
      regionId: Number(raw.regionId ?? 0),
      communeId: Number(raw.communeId ?? 0),
    };

    this.isSubmitting = true;
    this.profileService.updateProfile(dto).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.isEditing = false;
        this.profileForm.disable();
        this.lastProfileSnapshot = this.profileForm.getRawValue();
        alert('Perfil actualizado');
      },
      error: (err: any) => {
        console.error('update profile error', err);
        this.isSubmitting = false;
        alert(err?.error?.message ?? err?.message ?? 'Error actualizando perfil');
      },
    });
  }

  // ===== CUENTA BANCARIA =====
  private showBankSuccess(msg: string) {
    this.bankSuccess = msg;
    setTimeout(() => {
      if (this.bankSuccess === msg) this.bankSuccess = '';
    }, 2500);
  }

  loadBankAccount(run: number) {
    if (!run) return;

    this.bankLoading = true;
    this.bankError = '';
    this.bankSuccess = '';

    this.bankSvc.get(run).subscribe({
      next: (res) => {
        const acc = res?.bankAccount ?? null;

        if (acc) {
          this.bankHasAccount = true;
          this.bankEditing = false;

          this.bankForm.patchValue({
            rutOwner: acc.rutOwner ?? '',
            bankCode: acc.bankCode ?? '',
            bankName: acc.bankName ?? '',
            accountType: acc.accountType ?? '',
            accountNumber: acc.accountNumber ?? '',
            email: acc.email ?? '',
          });

          this.lastBankSnapshot = this.bankForm.getRawValue();
          this.bankForm.disable();
        } else {
          this.bankHasAccount = false;
          this.bankEditing = true;
          this.bankForm.reset({
            rutOwner: '',
            bankCode: '',
            bankName: '',
            accountType: '',
            accountNumber: '',
            email: '',
          });
          this.lastBankSnapshot = this.bankForm.getRawValue();
          this.bankForm.enable();
        }

        this.bankLoading = false;
      },
      error: (err: any) => {
        console.error('get bank account error', err);
        this.bankLoading = false;
        this.bankError = err?.error?.message ?? err?.message ?? 'No se pudo cargar cuenta bancaria.';
        this.bankForm.disable();
      },
    });
  }

  toggleBankEdit() {
    if (this.bankLoading || this.bankSaving) return;

    if (this.bankEditing) {
      if (this.lastBankSnapshot) this.bankForm.reset(this.lastBankSnapshot);
      this.bankForm.disable();
      this.bankEditing = false;
      return;
    }

    this.bankEditing = true;
    this.bankForm.enable();
  }

  saveBankAccount() {
    if (!this.currentRun) return;
    if (this.bankForm.invalid) return;

    const raw = this.bankForm.getRawValue();
    const payload: UpsertBankAccountPayload = {
      rutOwner: String(raw.rutOwner ?? ''),
      bankCode: String(raw.bankCode ?? ''),
      bankName: String(raw.bankName ?? ''),
      accountType: String(raw.accountType ?? ''),
      accountNumber: String(raw.accountNumber ?? ''),
      email: String(raw.email ?? ''),
    };

    this.bankSaving = true;
    this.bankError = '';
    this.bankSuccess = '';

    this.bankSvc.upsert(this.currentRun, payload).subscribe({
      next: () => {
        this.bankSaving = false;
        this.showBankSuccess(this.bankHasAccount ? 'Cuenta bancaria actualizada' : 'Cuenta bancaria guardada');
        this.loadBankAccount(this.currentRun);
      },
      error: (err: any) => {
        console.error('save bank account error', err);
        this.bankSaving = false;
        this.bankError = err?.error?.message ?? err?.message ?? 'No se pudo guardar la cuenta bancaria.';
      },
    });
  }
}