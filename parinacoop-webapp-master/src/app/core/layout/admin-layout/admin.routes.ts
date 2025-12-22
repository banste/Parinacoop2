import { Routes } from '@angular/router';
import { ROUTE_TOKENS } from '@app/route-tokens';

const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./admin-layout.component').then((m) => m.default),
    children: [
      {
        path: ROUTE_TOKENS.ADMIN_HOME,
        loadComponent: () =>
          import('@features/admin/home/home.component').then(
            (m) => m.HomeComponent,
          ),
      },
      {
        path: ROUTE_TOKENS.ADMIN_CLIENTS,
        loadComponent: () =>
          import('@features/admin/clients/clients.component').then(
            (m) => m.ClientsComponent,
          ),
      },
      {
        path: ROUTE_TOKENS.ADMIN_DAP_INSTRUCTIONS,
        loadComponent: () =>
          import(
            '@features/admin/dap-instructions/dap-instructions.component'
          ).then((m) => m.DapInstructionsComponent),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: ROUTE_TOKENS.ADMIN_HOME,
      },
      {
        path: '**',
        redirectTo: ROUTE_TOKENS.ADMIN_HOME,
      },
    ],
  },
];

export default adminRoutes;
