import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';
import { Role } from './models';
import { accueilDe } from './navigation';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.estConnecte() ? true : router.createUrlTree(['/connexion']);
};

/**
 * Page reservee a un role. Les autres retournent la ou ils arrivent apres la
 * connexion : le personnel sur sa premiere fonction, le client sur les menus.
 */
export function roleGuard(role: Role): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.estConnecte()) {
      return router.createUrlTree(['/connexion']);
    }
    return auth.aLeRole(role) ? true : router.createUrlTree([accueilDe(auth.utilisateur())]);
  };
}
