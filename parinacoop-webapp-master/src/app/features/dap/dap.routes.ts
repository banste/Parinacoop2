import { Routes } from '@angular/router';
import { ROUTE_TOKENS } from '@app/route-tokens';

export const dapRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./dap.component').then((m: any) => m.DapComponent ?? m.default),
  },

  // Página HISTORIAL: /cliente/depositos-a-plazo/cancelled
  {
    path: 'cancelled',
    loadComponent: () =>
      import('./components/cancelled-daps/cancelled-daps.component').then(
        (m: any) => m.CancelledDapsComponent ?? m.default,
      ),
  },

  {
    path: ROUTE_TOKENS.NEW_DAP,
    loadComponent: () =>
      import('./pages/new-dap/new-dap.component').then((m: any) => m.NewDapComponent ?? m.default),
  },
];

export default dapRoutes;