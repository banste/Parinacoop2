import { Routes } from '@angular/router';
import { ROUTE_TOKENS } from '@app/route-tokens';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./dap.component'),
  },
  {
    path: ROUTE_TOKENS.NEW_DAP,
    loadComponent: () => import('./pages/new-dap/new-dap.component'),
  },
];

export default routes;
