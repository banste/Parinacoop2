import { NgClass } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import {
  Router,
  NavigationStart,
  RouterOutlet,
  RouterLink,
} from '@angular/router';
import { AuthService } from '@app/core/auth/services/auth.service';
import { ProfileService } from '@app/features/profile/services/profile.service';
import { ROUTE_TOKENS } from '@app/route-tokens';
import { SvgIconComponent } from '@app/shared/components';
import { filter, Subscription } from 'rxjs';

type NavItem = {
  label: string;
  link: string;
  disabled?: boolean;
};

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [SvgIconComponent, RouterOutlet, NgClass, RouterLink],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export default class AdminLayoutComponent {
  navItems: NavItem[] = [
    {
      label: 'Inicio',
      link: ROUTE_TOKENS.ADMIN_HOME,
    },
    {
      label: 'Clientes',
      link: ROUTE_TOKENS.ADMIN_CLIENTS,
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
