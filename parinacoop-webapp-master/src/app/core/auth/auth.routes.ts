// src/app/core/auth/auth.routes.ts
import { Route } from '@angular/router';
import { ROUTE_TOKENS } from '@app/route-tokens';

const resolveComponent = (modPromise: Promise<any>, exportName: string) =>
  modPromise.then(m => (m as any)[exportName] ?? (m as any).default);

const routes: Route[] = [
  {
    path: '',
    redirectTo: ROUTE_TOKENS.AUTH_PATH,
    pathMatch: 'full',
  },
  {
    path: ROUTE_TOKENS.AUTH_PATH,
    loadComponent: () =>
      resolveComponent(import('@layout/auth-layout/auth-layout.component'), 'AuthLayoutComponent'),
    children: [
      {
        path: ROUTE_TOKENS.LOGIN,
        loadComponent: () => resolveComponent(import('./pages/login/login.component'), 'LoginComponent'),
      },
      {
        path: ROUTE_TOKENS.REGISTER,
        loadComponent: () => resolveComponent(import('./pages/register/register.component'), 'RegisterComponent'),
      },

      // <-- NUEVA RUTA: reset-password (pública dentro del layout de auth)
      {
        path: 'reset-password', // si tienes ROUTE_TOKENS.RESET_PASSWORD puedes usarlo en vez de 'reset-password'
        loadComponent: () =>
          resolveComponent(import('./pages/reset-password/reset-password.component'), 'ResetPasswordComponent'),
      },

      {
        path: ROUTE_TOKENS.PASSWORD_RECOVERY,
        loadComponent: () => resolveComponent(import('./pages/forgot-password/forgot-password.component'), 'ForgotPasswordComponent'),
      },
      {
        path: '**',
        redirectTo: ROUTE_TOKENS.LOGIN,
      },
    ],
  },
];

export default routes;