import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from './auth.service';

/**
 * Joint le jeton JWT aux appels vers l'API (choix_techniques_architecture.pdf :
 * liaison HTTPS, authentification sans etat). Si le serveur repond 401 a un
 * appel qui portait un jeton (jeton expire ou plus valable), on deconnecte.
 * Les appels sans jeton (par exemple une connexion refusee) ne sont pas concernes.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  if (!token || !req.url.startsWith('/api')) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  ).pipe(
    catchError((erreur: unknown) => {
      if (erreur instanceof HttpErrorResponse && erreur.status === 401) {
        authService.deconnecter();
        router.navigate(['/connexion']);
      }
      return throwError(() => erreur);
    }),
  );
};
