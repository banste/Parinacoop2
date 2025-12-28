import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@app/core/auth/services/auth.service';
import { ROUTE_TOKENS } from '@app/route-tokens';
import { Role } from '@app/shared/enums/roles';
import { take, map } from 'rxjs';

export const homeGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si no hay token/usuario autenticado, redirige al login
  if (!authService.isAuthenticated()) {
    return router.parseUrl(`/${ROUTE_TOKENS.LOGIN}`);
  }

  // Si hay token, toma currentUser$ una sola vez y decide por role
  return authService.currentUser$.pipe(
    take(1),
    map((user) =>
      user && user.role === Role.CLIENT ? true : router.parseUrl(`/${ROUTE_TOKENS.LOGIN}`),
    ),
  );
};