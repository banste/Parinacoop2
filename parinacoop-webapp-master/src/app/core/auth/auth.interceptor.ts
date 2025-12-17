import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { environment } from '@env/environment';
import { catchError, throwError } from 'rxjs';
import { EventBusService } from '@app/shared/services/event-bus/event-bus.service';
import { EventData } from '@app/shared/services/event-bus/event.class';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const eventBusService = inject(EventBusService);
  const token = authService.getAccessToken();

  const url = `${environment.apiUrl}/${req.url}`;

  const request = req.clone({
    url,
    setHeaders: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: 'application/json',
    },
  });

  return next(request).pipe(
    catchError((error) => {
      if (
        error instanceof HttpErrorResponse &&
        !req.url.includes('auth/login') &&
        error.status === 401
      ) {
        if (authService.isAuthenticated()) {
          eventBusService.emit(new EventData('logout', null));
        }
        return next(request);
      }
      return throwError(() => error);
    }),
  );
};
