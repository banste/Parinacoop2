import { Routes } from '@angular/router';
import { ROUTE_TOKENS } from '@app/route-tokens';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./dap.component').then((m) => m.default),
  },
  {
    path: ROUTE_TOKENS.NEW_DAP,
    loadComponent: () =>
      import('./pages/new-dap/new-dap.component').then((m) => m.default),
  },
];

export default routes;
