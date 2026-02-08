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
import { filter, takeUntil } from 'rxjs/operators';

import { AuthService } from '@app/core/auth/services/auth.service';
import { SvgIconComponent } from '@app/shared/components';
import { ROUTE_TOKENS } from '@app/route-tokens';
import { ProfileService } from '@app/features/profile/services/profile.service';
import { User } from '@app/shared/models/user.model';

/* FooterComponent importado para poder usar <app-footer /> en la plantilla */
import { FooterComponent } from '../auth-layout/components/footer/footer.component';

type NavItem = {
  label: string;
  link: string; // ejemplo: 'depositos-a-plazo' o 'depositos-a-plazo/cancelled'
  disabled?: boolean;
  routeSegments?: any[]; // se completará en ngOnInit
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
    FooterComponent, // agregado para usar <app-footer /> en la plantilla
  ],
  templateUrl: './home-layout.component.html',
  styleUrls: ['./home-layout.component.scss'],
})
export default class HomeLayoutComponent implements AfterViewInit, OnInit, OnDestroy {
  readonly ROUTE_TOKENS = ROUTE_TOKENS;

  // NAV: solo Depósitos a Plazo e Historial (historial = /cliente/depositos-a-plazo/cancelled)
  navItems: NavItem[] = [
    { label: 'Depósitos a Plazo', link: ROUTE_TOKENS.DAP },
    { label: 'Historial', link: `${ROUTE_TOKENS.DAP}/cancelled` },
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
    // Construir routeSegments de forma segura para cada nav item
    this.navItems = this.navItems.map((item) => {
      // split por '/' para convertir 'dap/cancelled' -> ['dap', 'cancelled']
      const parts = String(item.link ?? '').split('/').filter((p) => p.length > 0);
      // array absoluto para routerLink: ['/', 'cliente', 'dap', 'cancelled']
      const routeSegments = ['/', ROUTE_TOKENS.CLIENT_PATH, ...parts];
      return { ...item, routeSegments };
    });

    // el resto de tu ngOnInit original (perfil, usuario...)
    this.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((u) => {
        if (!u) {
          this.userName = null;
          return;
        }

        const maybeName = (u as any).name ?? (u as any).displayName;
        if (maybeName && String(maybeName).trim().length > 0) {
          this.userName = String(maybeName).trim();
          return;
        }

        this.tryLoadProfileIfMissing(u);
      });

    this.profileService.userProfile$
      .pipe(takeUntil(this.destroy$))
      .subscribe((profile) => {
        if (!profile) return;
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
      this.profileService.getCurrentProfile(runNumber).subscribe({
        next: (p) => {
          const name = this.extractNameFromProfile(p);
          if (name) {
            this.userName = name;
            console.debug('Header: asignado userName desde getCurrentProfile result', name, p);
          }
        },
        error: (err) => {
          console.debug('Header: getCurrentProfile error', err);
        },
      });
    } else {
      this.userName = (u && (u as any).run) ? `N° ${(u as any).run}` : null;
    }
  }

  private extractNameFromProfile(profile: any): string | null {
    if (!profile) return null;
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

  /**
   * locateLinkBackdrop:
   * - construye la ruta completa esperada por cada navItem (prefijo /cliente)
   * - busca coincidencia exacta o la coincidencia más específica (link más largo)
   */
  locateLinkBackdrop(path: string): void {
    if (!path) path = '/';
    const cleanPath = path.split('?')[0].split('#')[0];

    // prioridad: coincidencias más específicas primero (links más largos)
    const entries = this.navItems
      .map((item, idx) => ({ idx, link: item.link }))
      .sort((a, b) => b.link.length - a.link.length);

    let matchedIndex = -1;
    for (const e of entries) {
      const itemPath = `/${ROUTE_TOKENS.CLIENT_PATH}/${e.link}`; // e.link puede contener slashes
      if (cleanPath === itemPath) {
        matchedIndex = e.idx;
        break;
      }
      if (cleanPath.endsWith(itemPath)) {
        matchedIndex = e.idx;
        break;
      }
    }

    const safeIndex = Math.max(matchedIndex, 0);
    if (this.linkBackdrop) {
      this.linkBackdrop.nativeElement.style.setProperty('--left', `${safeIndex * 11}rem`);
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