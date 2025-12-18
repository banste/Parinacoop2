import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import {
  NavigationStart,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter, max, Subscription } from 'rxjs';

import { AuthService } from '@app/core/auth/services/auth.service';
import { SvgIconComponent } from '@app/shared/components';
import { NgClass } from '@angular/common';
import { ROUTE_TOKENS } from '@app/route-tokens';
import { ProfileService } from '@app/features/profile/services/profile.service';

type NavItem = {
  label: string;
  link: string;
  disabled?: boolean;
};

@Component({
  selector: 'app-home-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    SvgIconComponent,
    RouterLink,
    RouterLinkActive,
    NgClass,
  ],
  templateUrl: './home-layout.component.html',
  styleUrl: './home-layout.component.scss',
})
export default class HomeLayoutComponent implements AfterViewInit, OnDestroy {
  navItems: NavItem[] = [
    {
      label: 'Inicio',
      link: ROUTE_TOKENS.CLIENT_HOME,
    },
    {
      label: 'Depósitos a Plazo',
      link: ROUTE_TOKENS.DAP,
    },
    {
      label: 'Cuentas de Ahorro',
      link: ROUTE_TOKENS.CUENTA_AHORRO,
    },
    {
      label: 'Créditos de Consumo',
      link: 'creditos-de-consumo',
      disabled: true,
    },
    {
      label: 'Créditos Comerciales',
      link: 'creditos-comerciales',
      disabled: true,
    },
    {
      label: 'Perfil',
      link: ROUTE_TOKENS.PROFILE,
    },
  ];
  @ViewChild('linkBackdrop')
  linkBackdrop?: ElementRef<HTMLDivElement>;

  private routerSubscription?: Subscription;

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly profileService: ProfileService,
  ) {}

  ngAfterViewInit(): void {
    this.locateLinkBackdrop(this.router.url);
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationStart))
      .subscribe((event) => this.locateLinkBackdrop(event.url));

    // this.profileService.getCurrentProfile();
  }

  locateLinkBackdrop(path: string): void {
    // const url = path.replace(`/${ROUTE_TOKENS.CLIENT_PATH}`, '');

    const index = this.navItems.findIndex((item) => path.includes(item.link));

    if (this.linkBackdrop) {
      this.linkBackdrop.nativeElement.style.setProperty(
        '--left',
        `${Math.max(index, 0) * 11}rem`,
      );
    }
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate([ROUTE_TOKENS.AUTH_PATH]);
  }
}
