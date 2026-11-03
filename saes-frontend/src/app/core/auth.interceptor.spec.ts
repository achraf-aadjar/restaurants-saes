import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let serveur: HttpTestingController;

  function demarrer(jeton: string | null): void {
    localStorage.clear();
    if (jeton) {
      localStorage.setItem('saes_token', jeton);
      localStorage.setItem('saes_user', JSON.stringify({ id: 1, roles: ['CLIENT'] }));
    }
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    serveur = TestBed.inject(HttpTestingController);
  }

  afterEach(() => serveur.verify());

  it("joint le jeton aux appels vers l'API", () => {
    demarrer('jeton-123');

    http.get('/api/commandes').subscribe();

    expect(serveur.expectOne('/api/commandes').request.headers.get('Authorization')).toBe('Bearer jeton-123');
  });

  it("n'envoie jamais le jeton hors de l'API", () => {
    demarrer('jeton-123');

    http.get('https://exemple.com/donnees').subscribe();

    expect(serveur.expectOne('https://exemple.com/donnees').request.headers.has('Authorization')).toBe(false);
  });

  it('sans session, aucun jeton n est joint', () => {
    demarrer(null);

    http.get('/api/public/restaurants').subscribe();

    expect(serveur.expectOne('/api/public/restaurants').request.headers.has('Authorization')).toBe(false);
  });

  it('un jeton refuse (401) deconnecte et renvoie vers la page de connexion', () => {
    demarrer('jeton-expire');
    const navigation = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    http.get('/api/me').subscribe({ error: () => undefined });
    serveur.expectOne('/api/me').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(TestBed.inject(AuthService).estConnecte()).toBe(false);
    expect(navigation).toHaveBeenCalledWith(['/connexion']);
  });

  it('un refus de role (403) ne deconnecte pas', () => {
    demarrer('jeton-123');

    http.get('/api/gerant/plats').subscribe({ error: () => undefined });
    serveur.expectOne('/api/gerant/plats').flush(null, { status: 403, statusText: 'Forbidden' });

    expect(TestBed.inject(AuthService).estConnecte()).toBe(true);
  });
});
