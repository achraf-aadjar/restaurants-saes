import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

import { AuthService } from './auth.service';
import { Role } from './models';
import { accueilDe, estPersonnel } from './navigation';

/**
 * Sans compte, on part vers la connexion en retenant la page demandee : la
 * connexion y ramene ensuite (par exemple le formulaire de reservation ouvert
 * depuis le bouton « Reserver » des menus).
 */
function versLaConnexion(router: Router, pageDemandee: string | undefined): UrlTree {
  return router.createUrlTree(['/connexion'], { queryParams: { retour: pageDemandee } });
}

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.estConnecte() ? true : versLaConnexion(router, state.url);
};

/**
 * Page reservee a un role. Les autres retournent la ou ils arrivent apres la
 * connexion : le personnel sur sa premiere fonction, le client sur les menus.
 */
export function roleGuard(role: Role): CanActivateFn {
  return (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.estConnecte()) {
      return versLaConnexion(router, state.url);
    }
    return auth.aLeRole(role) ? true : router.createUrlTree([accueilDe(auth.utilisateur())]);
  };
}

/**
 * Page d'accueil « / » : la vitrine est faite pour le visiteur et le client. Un
 * membre du personnel ou un administrateur est renvoye vers sa premiere
 * fonction, comme avant l'existence de cette page.
 */
export const vitrineGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const utilisateur = auth.utilisateur();
  const personnel =
    estPersonnel(utilisateur) || (utilisateur?.roles.includes('ADMINISTRATEUR') ?? false);
  return personnel ? router.parseUrl(accueilDe(utilisateur)) : true;
};
