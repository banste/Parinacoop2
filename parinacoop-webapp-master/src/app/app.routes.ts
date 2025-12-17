import { Routes } from '@angular/router';
import { inject } from '@angular/core';

import { ROUTE_TOKENS } from './route-tokens';
import { AuthService } from './core/auth/services/auth.service';
import { adminGuard } from '@layout/admin-layout/guards/admin.guard';
import { homeGuard } from '@layout/home-layout/guards/home.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [() => !inject(AuthService).isAuthenticated()],
    canMatch: [() => !inject(AuthService).isAuthenticated()],
    loadChildren: () => import('./core/auth/auth.routes'),
  },
  {
    path: '',
    canActivate: [homeGuard],
    canMatch: [homeGuard],
    loadChildren: () => import('@layout/home-layout/home.routes'),
  },
  {
    path: '',
    canActivate: [adminGuard],
    canMatch: [adminGuard],
    loadChildren: () => import('@layout/admin-layout/admin.routes'),
  },
  {
    path: '**',
    redirectTo: ROUTE_TOKENS.AUTH_PATH,
  },
];
