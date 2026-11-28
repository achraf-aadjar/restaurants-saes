import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { Register } from './register';

/** L'inscription demande si la personne est étudiante ou professeure (abonnements). */
describe('Register : étudiant ou professeur', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  function composant() {
    const fixture = TestBed.createComponent(Register);
    fixture.detectChanges();
    return fixture;
  }

  it('propose Étudiant et Professeur, sans rien présélectionner', () => {
    const fixture = composant();
    const html = fixture.nativeElement as HTMLElement;

    const choix = Array.from(html.querySelectorAll<HTMLInputElement>('input[name="profil"]'));
    expect(choix.map((c) => c.nextElementSibling?.textContent?.trim())).toEqual([
      'Étudiant',
      'Professeur',
    ]);
    expect(choix.some((c) => c.checked)).toBe(false);
  });

  it("refuse de s'inscrire sans profil, sans appeler le serveur", () => {
    const fixture = composant();
    const page = fixture.componentInstance as unknown as {
      valider: () => void;
      profilManquant: () => boolean;
    };

    page.valider();
    fixture.detectChanges();

    expect(page.profilManquant()).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Indiquez si vous êtes étudiant ou professeur',
    );
    http.expectNone('/api/auth/register');
  });

  it('envoie le profil choisi avec les autres informations', () => {
    const fixture = composant();
    const page = fixture.componentInstance as unknown as Record<string, unknown> & {
      choisirProfil: (p: string) => void;
      valider: () => void;
    };
    Object.assign(page, {
      nom: 'Sow',
      prenom: 'Ibou',
      email: 'ibou@test.sn',
      motDePasse: 'motdepasse123',
    });

    page.choisirProfil('PROFESSEUR');
    page.valider();

    const requete = http.expectOne('/api/auth/register');
    expect(requete.request.body).toMatchObject({ email: 'ibou@test.sn', profil: 'PROFESSEUR' });
  });

  it('laisse le bouton Google en retrait tant que le profil manque', () => {
    const fixture = composant();
    const google = (fixture.nativeElement as HTMLElement).querySelector('.auth-google');

    expect(google?.hasAttribute('inert')).toBe(true);

    (fixture.componentInstance as unknown as { choisirProfil: (p: string) => void }).choisirProfil(
      'ETUDIANT',
    );
    fixture.detectChanges();

    expect(google?.hasAttribute('inert')).toBe(false);
  });
});
