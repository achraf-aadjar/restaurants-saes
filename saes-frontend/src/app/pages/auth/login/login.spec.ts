import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { Login } from './login';

describe('Page de connexion', () => {
  let fixture: ComponentFixture<Login>;
  let page: HTMLElement;
  let serveur: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(Login);
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

  async function envoyer(): Promise<void> {
    page.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  it("un formulaire vide n'est pas envoye et chaque champ indique quoi faire", async () => {
    await envoyer();

    serveur.expectNone('/api/auth/login');
    expect(page.textContent).toContain('Saisissez votre adresse e-mail.');
    expect(page.textContent).toContain('Saisissez votre mot de passe.');
  });

  it('une adresse e-mail mal formee est signalee', async () => {
    await saisir('#email', 'pas-une-adresse');
    await saisir('#motDePasse', 'motdepasse123');
    await envoyer();

    serveur.expectNone('/api/auth/login');
    expect(page.textContent).toContain('Adresse e-mail invalide.');
  });

  it('des identifiants valides sont envoyes puis on arrive sur les menus', async () => {
    const navigation = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await saisir('#email', 'awa@test.sn');
    await saisir('#motDePasse', 'motdepasse123');
    await envoyer();

    const requete = serveur.expectOne('/api/auth/login');
    expect(requete.request.body).toEqual({ email: 'awa@test.sn', motDePasse: 'motdepasse123' });
    requete.flush({ token: 'jeton', utilisateur: { id: 1, roles: ['CLIENT'] } });
    await fixture.whenStable();

    expect(navigation).toHaveBeenCalledWith(['/menus']);
  });

  it('un refus du serveur affiche son motif', async () => {
    await saisir('#email', 'awa@test.sn');
    await saisir('#motDePasse', 'mauvais');
    await envoyer();

    serveur
      .expectOne('/api/auth/login')
      .flush({ motif: 'Adresse e-mail ou mot de passe incorrect' }, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();

    expect(page.querySelector('[role="alert"]')?.textContent).toContain('Adresse e-mail ou mot de passe incorrect');
  });

  it('le mot de passe peut etre affiche puis masque', async () => {
    const champ = page.querySelector<HTMLInputElement>('#motDePasse')!;
    const bouton = page.querySelector<HTMLButtonElement>('.auth-oeil')!;
    expect(champ.type).toBe('password');

    bouton.click();
    await fixture.whenStable();
    expect(champ.type).toBe('text');
    expect(bouton.getAttribute('aria-pressed')).toBe('true');

    bouton.click();
    await fixture.whenStable();
    expect(champ.type).toBe('password');
  });
});
