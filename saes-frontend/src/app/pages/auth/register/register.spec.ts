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

  async function remplir(motDePasse: string): Promise<void> {
    await saisir('#prenom', 'Awa');
    await saisir('#nom', 'Diop');
    await saisir('#email', 'awa@test.sn');
    await saisir('#motDePasse', motDePasse);
  }

  async function envoyer(): Promise<void> {
    page.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  it('un mot de passe de moins de 8 caracteres est refuse avant tout envoi', async () => {
    await remplir('1234567');
    await envoyer();

    serveur.expectNone('/api/auth/register');
    expect(page.textContent).toContain('Au moins 8 caractères.');
  });

  it('les champs obligatoires manquants sont signales', async () => {
    await envoyer();

    serveur.expectNone('/api/auth/register');
    expect(page.textContent).toContain('Saisissez votre prénom.');
    expect(page.textContent).toContain('Saisissez votre nom.');
    expect(page.textContent).toContain('Choisissez un mot de passe.');
  });

  it("le telephone est facultatif : sans lui, l'inscription est envoyee sans telephone", async () => {
    const navigation = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await remplir('motdepasse123');
    await envoyer();

    const requete = serveur.expectOne('/api/auth/register');
    expect(requete.request.body).toEqual({
      nom: 'Diop',
      prenom: 'Awa',
      email: 'awa@test.sn',
      motDePasse: 'motdepasse123',
      telephone: undefined,
    });
    requete.flush({ token: 'jeton', utilisateur: { id: 1, roles: ['CLIENT'] } }, { status: 201, statusText: 'Created' });
    await fixture.whenStable();

    expect(navigation).toHaveBeenCalledWith(['/menus']);
  });

  it('une adresse deja utilisee affiche le motif du serveur', async () => {
    await remplir('motdepasse123');
    await envoyer();

    serveur
      .expectOne('/api/auth/register')
      .flush({ motif: 'Cette adresse e-mail est déjà utilisée' }, { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();

    expect(page.querySelector('[role="alert"]')?.textContent).toContain('Cette adresse e-mail est déjà utilisée');
  });

  it('la page renvoie vers la politique de confidentialite (loi n° 2008-12)', () => {
    const liens = Array.from(page.querySelectorAll('a')).map((a) => a.getAttribute('href'));

    expect(liens).toContain('/confidentialite');
  });
});
