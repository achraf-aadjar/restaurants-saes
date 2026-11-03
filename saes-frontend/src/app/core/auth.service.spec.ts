import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { AuthResponse, Utilisateur } from './models';

const CLIENT: Utilisateur = {
  id: 7,
  nom: 'Diop',
  prenom: 'Awa',
  email: 'awa@test.sn',
  telephone: null,
  roles: ['CLIENT'],
  restaurantId: null,
  restaurantNom: null,
  estActif: true,
};

const REPONSE: AuthResponse = { token: 'jeton-123', utilisateur: CLIENT };

describe('AuthService', () => {
  let http: HttpTestingController;

  function creerService(): AuthService {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    return TestBed.inject(AuthService);
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => http.verify());

  it("s'authentifier enregistre le jeton et l'utilisateur, puis donne ses roles", () => {
    const auth = creerService();

    auth.authentifier({ email: 'awa@test.sn', motDePasse: 'motdepasse123' }).subscribe();
    const requete = http.expectOne('/api/auth/login');
    expect(requete.request.method).toBe('POST');
    expect(requete.request.body).toEqual({ email: 'awa@test.sn', motDePasse: 'motdepasse123' });
    requete.flush(REPONSE);

    expect(auth.estConnecte()).toBe(true);
    expect(auth.getToken()).toBe('jeton-123');
    expect(auth.aLeRole('CLIENT')).toBe(true);
    expect(auth.aLeRole('GERANT')).toBe(false);
  });

  it("s'inscrire connecte directement le nouveau client", () => {
    const auth = creerService();

    auth
      .inscrire({ nom: 'Diop', prenom: 'Awa', email: 'awa@test.sn', motDePasse: 'motdepasse123' })
      .subscribe();
    http.expectOne('/api/auth/register').flush(REPONSE);

    expect(auth.utilisateur()?.email).toBe('awa@test.sn');
  });

  it('la connexion Google envoie le jeton Google au serveur, jamais directement accepte', () => {
    const auth = creerService();

    auth.authentifierAvecGoogle({ idToken: 'jeton-google' }).subscribe();
    const requete = http.expectOne('/api/auth/google');
    expect(requete.request.body).toEqual({ idToken: 'jeton-google' });
    requete.flush(REPONSE);

    expect(auth.estConnecte()).toBe(true);
  });

  it('une connexion refusee ne connecte personne', () => {
    const auth = creerService();

    auth.authentifier({ email: 'awa@test.sn', motDePasse: 'faux' }).subscribe({ error: () => undefined });
    http
      .expectOne('/api/auth/login')
      .flush({ motif: 'Adresse e-mail ou mot de passe incorrect' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.estConnecte()).toBe(false);
    expect(auth.getToken()).toBeNull();
  });

  it('la session survit a un rechargement de la page', () => {
    localStorage.setItem('saes_token', 'jeton-123');
    localStorage.setItem('saes_user', JSON.stringify(CLIENT));

    const auth = creerService();

    expect(auth.estConnecte()).toBe(true);
    expect(auth.utilisateur()?.prenom).toBe('Awa');
  });

  it('une session stockee illisible est ignoree', () => {
    localStorage.setItem('saes_user', '{pas du json');

    const auth = creerService();

    expect(auth.estConnecte()).toBe(false);
  });

  it('se deconnecter efface la session', () => {
    localStorage.setItem('saes_token', 'jeton-123');
    localStorage.setItem('saes_user', JSON.stringify(CLIENT));
    const auth = creerService();

    auth.deconnecter();

    expect(auth.estConnecte()).toBe(false);
    expect(localStorage.getItem('saes_token')).toBeNull();
    expect(localStorage.getItem('saes_user')).toBeNull();
  });
});
