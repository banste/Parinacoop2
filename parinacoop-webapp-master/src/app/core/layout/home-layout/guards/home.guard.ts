import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '@app/core/auth/services/auth.service';
import { Role } from '@app/shared/enums/roles';
import { filter, map } from 'rxjs';

export const homeGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  return authService.currentUser$.pipe(
    filter((user) => user !== null),
    map((user) => user.role === Role.CLIENT && authService.isAuthenticated()),
  );
  // return authService.isAuthenticated() && authService.isClient();
};
