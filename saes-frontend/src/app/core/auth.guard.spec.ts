import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';

import { authGuard, roleGuard } from './auth.guard';
import { Role, Utilisateur } from './models';

function connecter(roles: Role[]): void {
  const utilisateur: Utilisateur = {
    id: 1,
    nom: 'Ba',
    prenom: 'Omar',
    email: 'omar@test.sn',
    telephone: null,
    roles,
    restaurantId: 1,
    restaurantNom: 'Restaurant',
    estActif: true,
  };
  localStorage.setItem('saes_token', 'jeton');
  localStorage.setItem('saes_user', JSON.stringify(utilisateur));
}

function executer(garde: typeof authGuard): boolean | UrlTree {
  return TestBed.runInInjectionContext(() =>
    garde({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
  ) as boolean | UrlTree;
}

function cheminDe(resultat: boolean | UrlTree): string | boolean {
  return resultat instanceof UrlTree ? TestBed.inject(Router).serializeUrl(resultat) : resultat;
}

describe('Gardes de navigation (droits d acces, qualite attendue 1)', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });
  });

  it('une page reservee renvoie vers la connexion sans compte', () => {
    expect(cheminDe(executer(authGuard))).toBe('/connexion');
    expect(cheminDe(executer(roleGuard('GERANT')))).toBe('/connexion');
  });

  it("un utilisateur connecte accede aux pages qui n'exigent pas de role", () => {
    connecter(['CLIENT']);

    expect(executer(authGuard)).toBe(true);
  });

  it('une page de role est refusee aux autres roles et renvoie a l accueil', () => {
    connecter(['SERVEUR']);

    expect(executer(roleGuard('SERVEUR'))).toBe(true);
    expect(cheminDe(executer(roleGuard('CAISSIER')))).toBe('/');
    expect(cheminDe(executer(roleGuard('ADMINISTRATEUR')))).toBe('/');
  });

  it('un compte a plusieurs roles accede aux pages de chacun', () => {
    connecter(['GERANT', 'CAISSIER']);

    expect(executer(roleGuard('GERANT'))).toBe(true);
    expect(executer(roleGuard('CAISSIER'))).toBe(true);
    expect(cheminDe(executer(roleGuard('CUISINIER')))).toBe('/');
  });
});
