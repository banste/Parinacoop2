import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  NavigationStart,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { CommonModule, NgClass, AsyncPipe } from '@angular/common';
import { Subject, Subscription, Observable } from 'rxjs';
import { filter, takeUntil, filter as rxFilter } from 'rxjs/operators';

import { AuthService } from '@app/core/auth/services/auth.service';
import { SvgIconComponent } from '@app/shared/components';
import { ROUTE_TOKENS } from '@app/route-tokens';
import { ProfileService } from '@app/features/profile/services/profile.service';
import { User } from '@app/shared/models/user.model';

type NavItem = {
  label: string;
  link: string;
  disabled?: boolean;
};

@Component({
  selector: 'app-home-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SvgIconComponent,
    RouterLink,
    RouterLinkActive,
    NgClass,
    AsyncPipe,
  ],
  templateUrl: './home-layout.component.html',
  styleUrl: './home-layout.component.scss',
})
export default class HomeLayoutComponent implements AfterViewInit, OnInit, OnDestroy {
  readonly ROUTE_TOKENS = ROUTE_TOKENS;

  navItems: NavItem[] = [
    { label: 'Inicio', link: ROUTE_TOKENS.CLIENT_HOME },
    { label: 'Depósitos a Plazo', link: ROUTE_TOKENS.DAP },
    { label: 'Perfil', link: ROUTE_TOKENS.PROFILE },
  ];

  @ViewChild('linkBackdrop') linkBackdrop?: ElementRef<HTMLDivElement>;
  private routerSubscription?: Subscription;
  private destroy$ = new Subject<void>();

  public currentUser$!: Observable<User | null>;
  public userName: string | null = null;

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly profileService: ProfileService
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    // 1) Cuando tengamos un currentUser con run, pedimos el profile al backend.
    this.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((u) => {
        if (!u) {
          this.userName = null;
          return;
        }

        // Si ya tenemos nombre en el user (AuthService lo mapeó), úsalo; si no, pedimos el profile.
        const maybeName = (u as any).name ?? (u as any).displayName;
        if (maybeName && String(maybeName).trim().length > 0) {
          this.userName = String(maybeName).trim();
          // Aun así podemos intentar cargar profile para tener datos completos en cache (opcional)
          // this.tryLoadProfileIfMissing(u);
          return;
        }

        // try load profile using run
        this.tryLoadProfileIfMissing(u);
      });

    // 2) Escuchamos userProfile$ para rellenar el nombre cuando el profile llegue.
    this.profileService.userProfile$
      .pipe(takeUntil(this.destroy$))
      .subscribe((profile) => {
        if (!profile) return;
        // El backend devuelve profile.names y profile.firstLastName según tu log
        const name = this.extractNameFromProfile(profile);
        if (name) {
          this.userName = name;
          console.debug('Header: asignado userName desde profile.userProfile$', name, profile);
        }
      });
  }

  private tryLoadProfileIfMissing(u: User | null): void {
    if (!u) return;
    const runNumber = Number((u as any).run ?? 0);
    if (!Number.isNaN(runNumber) && runNumber > 0) {
      // Llamada que actualiza profileService.userProfile$ internamente
      this.profileService.getCurrentProfile(runNumber).subscribe({
        next: (p) => {
          // getCurrentProfile hace tap(...) que actualiza userProfile$, pero por si acaso procesamos el resultado
          const name = this.extractNameFromProfile(p);
          if (name) {
            this.userName = name;
            console.debug('Header: asignado userName desde getCurrentProfile result', name, p);
          }
        },
        error: (err) => {
          // no crítico: dejamos userName como estaba (probablemente run)
          console.debug('Header: getCurrentProfile error', err);
        },
      });
    } else {
      // Fallback: usar run si no hay profile
      this.userName = (u && (u as any).run) ? `N° ${(u as any).run}` : null;
    }
  }

  private extractNameFromProfile(profile: any): string | null {
    if (!profile) return null;
    // Observé en tu log: profile.names = 'Cesar', profile.firstLastName = 'Monsalvez'
    const names = profile.names ?? profile.name ?? profile.nombres ?? profile.firstName ?? profile.given_name;
    const last = profile.firstLastName ?? profile.lastName ?? profile.last_name ?? profile.family_name ?? profile.apellido;
    if (names && last) return `${String(names).trim()}`;
    if (names) return String(names).trim();
    if (profile.fullName) return String(profile.fullName).trim();
    if (profile.displayName) return String(profile.displayName).trim();
    if (profile.run) return `N° ${profile.run}`;
    return null;
  }

  ngAfterViewInit(): void {
    this.locateLinkBackdrop(this.router.url);
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationStart))
      .subscribe((event) => this.locateLinkBackdrop((event as NavigationStart).url));
  }

  locateLinkBackdrop(path: string): void {
    const index = this.navItems.findIndex((item) => path.includes(item.link));
    if (this.linkBackdrop) {
      this.linkBackdrop.nativeElement.style.setProperty('--left', `${Math.max(index, 0) * 11}rem`);
    }
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/');
  }
}