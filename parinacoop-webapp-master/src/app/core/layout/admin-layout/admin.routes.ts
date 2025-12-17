import { Routes } from '@angular/router';
import { ROUTE_TOKENS } from '@app/route-tokens';

const adminRoutes: Routes = [
  {
    path: '',
    redirectTo: ROUTE_TOKENS.ADMIN_PATH,
    pathMatch: 'full',
  },
  {
    path: ROUTE_TOKENS.ADMIN_PATH,
    loadComponent: () => import('./admin-layout.component'),
    children: [
      {
        path: ROUTE_TOKENS.ADMIN_HOME,
        loadComponent: () => import('@features/admin/home/home.component'),
      },
      {
        path: ROUTE_TOKENS.ADMIN_CLIENTS,
        loadComponent: () =>
          import('@features/admin/clients/clients.component'),
      },
      {
        path: '**',
        redirectTo: ROUTE_TOKENS.ADMIN_HOME,
      }
    ],
  },
];

export default adminRoutes;
