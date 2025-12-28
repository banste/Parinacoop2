import { Routes } from '@angular/router';
import { inject } from '@angular/core';

import { ROUTE_TOKENS } from './route-tokens';
import { AuthService } from './core/auth/services/auth.service';
import { adminGuard } from '@layout/admin-layout/guards/admin.guard';
import { homeGuard } from '@layout/home-layout/guards/home.guard';

export const routes: Routes = [
  // Si ya está autenticado y pide la raíz, redirigir a cliente
  {
    path: '',
    canMatch: [() => inject(AuthService).isAuthenticated()],
    redirectTo: ROUTE_TOKENS.CLIENT_PATH,
    pathMatch: 'full',
  },

  // AUTH (solo si NO está autenticado)
  {
    path: ROUTE_TOKENS.AUTH_PATH, // ''
    canActivate: [() => !inject(AuthService).isAuthenticated()],
    canMatch: [() => !inject(AuthService).isAuthenticated()],
    loadChildren: () => import('./core/auth/auth.routes'),
  },

  // HOME / CLIENT
  {
    path: ROUTE_TOKENS.CLIENT_PATH, // 'cliente'
    canActivate: [homeGuard],
    canMatch: [homeGuard],
    loadChildren: () => import('@layout/home-layout/home.routes'),
  },

  // ADMIN
  {
    path: ROUTE_TOKENS.ADMIN_PATH, // 'admin'
    canActivate: [adminGuard],
    canMatch: [adminGuard],
    loadChildren: () => import('@layout/admin-layout/admin.routes'),
  },

  // FALLBACK
  {
    path: '**',
    redirectTo: ROUTE_TOKENS.AUTH_PATH,
  },
];