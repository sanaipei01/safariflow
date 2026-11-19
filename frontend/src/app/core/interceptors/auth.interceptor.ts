import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

const AUTH_URLS = ['/auth/login', '/auth/register'];

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const isApiRequest = request.url.startsWith(environment.apiUrl);
  const token = auth.token;

  const authorized =
    isApiRequest && token
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;

  return next(authorized).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthRequest = AUTH_URLS.some((url) => request.url.endsWith(url));
      if (error.status === 401 && isApiRequest && !isAuthRequest) {
        auth.logout();
      }
      return throwError(() => error);
    }),
  );
};
