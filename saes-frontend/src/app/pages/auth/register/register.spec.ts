import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { Register } from './register';

describe("Page d'inscription", () => {
  let fixture: ComponentFixture<Register>;
  let page: HTMLElement;
  let serveur: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(Register);
    page = fixture.nativeElement;
    serveur = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => serveur.verify());

  async function saisir(selecteur: string, valeur: string): Promise<void> {
    const champ = page.querySelector<HTMLInputElement>(selecteur)!;
    champ.value = valeur;
    champ.dispatchEvent(new Event('input'));
    champ.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
  }

  async function remplir(): Promise<void> {
    await saisir('#prenom', 'Awa');
    await saisir('#nom', 'Diop');
    await saisir('#email', 'awa@test.sn');
    await saisir('#motDePasse', 'motdepasse123');
  }

  async function envoyer(): Promise<void> {
    page.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  it("le telephone est facultatif : sans lui, l'inscription est envoyee sans telephone", async () => {
    const navigation = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await remplir();
    await envoyer();

    const requete = serveur.expectOne('/api/auth/register');
    expect(requete.request.body).toEqual({
      nom: 'Diop',
      prenom: 'Awa',
      email: 'awa@test.sn',
      motDePasse: 'motdepasse123',
      telephone: undefined,
    });
    requete.flush(
      { token: 'jeton', utilisateur: { id: 1, roles: ['CLIENT'] } },
      { status: 201, statusText: 'Created' },
    );
    await fixture.whenStable();

    expect(navigation).toHaveBeenCalledWith(['/menus']);
  });

  it('la page renvoie vers la politique de confidentialite (loi n° 2008-12)', () => {
    const liens = Array.from(page.querySelectorAll('a')).map((a) => a.getAttribute('href'));

    expect(liens).toContain('/confidentialite');
  });
});
