import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

const AUTH_ENDPOINTS = ['/api/auth/login', '/api/auth/register'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  const token = authService.getToken();
  const authReq = token
    ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
    : req;

  const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => req.url.includes(path));

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!isAuthEndpoint && (error.status === 401 || error.status === 403)) {
        authService.logout();
        router.navigate(['/login']);
        snackBar.open('Tu sesión expiró, inicia sesión nuevamente', 'Cerrar', {
          duration: 5000,
        });
      }
      return throwError(() => error);
    })
  );
};
