import { Routes } from '@angular/router';
import { ROUTE_TOKENS } from '@app/route-tokens';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./cuenta-ahorro.component'),
  },
];

export default routes;