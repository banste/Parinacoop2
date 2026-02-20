import { Routes } from '@angular/router';
import { ROUTE_TOKENS } from '@app/route-tokens';

const homeRoutes: Routes = [
  // Este archivo se carga bajo la ruta /cliente (definida en app.routes).
  // Por eso aquí el layout principal debe estar en path: '' (vacío),
  // y los child paths (inicio, depositos-a-plazo, perfil, ...) se declaran
  // respecto de esa ruta base.
  {
    path: '',
    loadComponent: () => import('@layout/home-layout/home-layout.component'),
    children: [
      // Cambié la redirección por defecto para que vaya a "depositos-a-plazo"
      // en lugar de a la página de inicio.
      {
        path: '',
        redirectTo: ROUTE_TOKENS.DAP,
        pathMatch: 'full',
      },

      // Nueva ruta específica para historial (cancelled)
      {
        // /cliente/depositos-a-plazo/cancelled
        path: `${ROUTE_TOKENS.DAP}/cancelled`,
        loadComponent: () =>
          import('@features/dap/components/cancelled-daps/cancelled-daps.component')
            .then((m) => m.CancelledDapsComponent),
      },

      {
        path: ROUTE_TOKENS.DAP, // 'depositos-a-plazo' -> /cliente/depositos-a-plazo
        loadChildren: () => import('@features/dap/dap.routes'),
      },
      {
        path: ROUTE_TOKENS.PROFILE, // 'perfil' -> /cliente/perfil
        loadComponent: () => import('@features/profile/profile.component'),
      },

      // 'cuentas-de-ahorro' eliminado intencionalmente
      // otras rutas globales que quieras dejar, por ahora no hay más
    ],
  },
];

export default homeRoutes;