import { Route } from '@angular/router';
import { ROUTE_TOKENS } from '@app/route-tokens';

const routes: Route[] = [
  {
    path: '',
    redirectTo: ROUTE_TOKENS.AUTH_PATH,
    pathMatch: 'full',
  },
  {
    path: ROUTE_TOKENS.AUTH_PATH,
    loadComponent: () => import('@layout/auth-layout/auth-layout.component'),
    children: [
      {
        path: ROUTE_TOKENS.LOGIN,
        loadComponent: () => import('./pages/login/login.component'),
      },
      {
        path: ROUTE_TOKENS.REGISTER,
        loadComponent: () => import('./pages/register/register.component'),
      },
      {
        path: ROUTE_TOKENS.PASSWORD_RECOVERY,
        loadComponent: () =>
          import('./pages/password-recovery/password-recovery.component'),
      },
      {
        path: '**',
        redirectTo: ROUTE_TOKENS.LOGIN,
      },
    ],
  },
];

export default routes;
