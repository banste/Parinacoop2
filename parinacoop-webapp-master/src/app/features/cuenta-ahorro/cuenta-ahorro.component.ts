import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject, takeUntil, filter } from 'rxjs';
import { CuentaAhorroService } from './cuenta-ahorro.service';
import { AuthService } from '@app/core/auth/services/auth.service';
import { TipoAhorroPipe } from './pipes/tipo-ahorro.pipe';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SvgIconComponent } from '@app/shared/components/svg-icon/svg-icon.component';
import { CuentaAhorroItemComponent } from './components/cuenta-ahorro-item.component';

@Component({
  selector: 'app-cuenta-ahorro',
  standalone: true,
  imports: [ 
    AsyncPipe,          // aquí van los pipes
    CurrencyPipe,       
    RouterLink,         
    SvgIconComponent,
    CuentaAhorroItemComponent,
    TipoAhorroPipe,  
   ],
  templateUrl: './cuenta-ahorro.component.html',
})

export default class CuentaAhorroComponent implements OnInit, OnDestroy {
  savingTotals$: Observable<{ total: number; interests: number }>;
  savingAccounts$: Observable<any[]>;
  perfil$!: Observable<any>;

  private onDestroy$ = new Subject<void>();

  constructor(
    private cuentaAhorroService: CuentaAhorroService,
    private authService: AuthService
  ) {
    this.savingTotals$ = this.cuentaAhorroService.totals$;
    this.savingAccounts$ = this.cuentaAhorroService.accounts$;
  }

  ngOnInit() {
    this.authService.currentUser$
      .pipe(
        takeUntil(this.onDestroy$),
        filter(user => user !== null)
      )
      .subscribe(user => {
        this.perfil$ = this.cuentaAhorroService.getClientProfile(user.run);
        this.cuentaAhorroService.getAhorroList(user.run); // si necesitas las cuentas de ahorro
      });
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }
}
