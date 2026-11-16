import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { PlatResume, Role, Utilisateur } from './models';
import { PanierService } from './panier.service';

const THIEB: PlatResume = {
  id: 1,
  nom: 'Thieboudienne',
  description: null,
  prix: 2500,
  categorie: 'PLAT_PRINCIPAL',
};
const YASSA: PlatResume = {
  id: 2,
  nom: 'Yassa poulet',
  description: null,
  prix: 2000,
  categorie: 'PLAT_PRINCIPAL',
};

function utilisateur(role: Role): Utilisateur {
  return {
    id: 7,
    nom: 'Diop',
    prenom: 'Awa',
    email: 'awa@test.sn',
    telephone: null,
    roles: [role],
    restaurantId: null,
    restaurantNom: null,
    estActif: true,
  };
}

describe('PanierService', () => {
  const connecte = signal<Utilisateur | null>(null);

  function creerService(): PanierService {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { utilisateur: connecte } }],
    });
    const panier = TestBed.inject(PanierService);
    TestBed.tick();
    return panier;
  }

  beforeEach(() => {
    sessionStorage.clear();
    connecte.set(null);
  });

  it('compte les articles et fait le total des lignes', () => {
    const panier = creerService();

    panier.ajouter(THIEB, 1);
    panier.ajouter(THIEB, 1);
    panier.ajouter(YASSA, 1);
    panier.retirer(THIEB);

    expect(panier.nombreArticles()).toBe(2);
    expect(panier.total()).toBe(4500);
  });

  it("un plat d'un autre restaurant remplace le panier", () => {
    const panier = creerService();

    panier.ajouter(THIEB, 1);
    panier.ajouter(YASSA, 2);

    expect(panier.restaurantId()).toBe(2);
    expect(panier.lignes().map((l) => l.plat.id)).toEqual([2]);
  });

  it("garde le panier dans l'onglet et le retrouve au rechargement", () => {
    creerService().ajouter(THIEB, 1);
    TestBed.tick();
    TestBed.resetTestingModule();

    const recharge = creerService();

    expect(recharge.nombreArticles()).toBe(1);
    expect(recharge.restaurantId()).toBe(1);
  });

  it('prend les prix du jour et retire les plats qui ne sont plus proposes', () => {
    const panier = creerService();
    panier.ajouter(THIEB, 1);
    panier.ajouter(YASSA, 1);

    panier.actualiser(1, [{ ...THIEB, prix: 3000 }]);

    expect(panier.lignes().map((l) => l.plat.id)).toEqual([1]);
    expect(panier.total()).toBe(3000);
  });

  it('un panier garde abime est ignore', () => {
    sessionStorage.setItem('saes_panier', '{"restaurantId":1,"lignes":[{"quantite":2}]}');

    expect(creerService().nombreArticles()).toBe(0);
  });

  it("le visiteur qui se connecte comme client garde son panier, qui se rouvre s'il l'a demande", () => {
    const panier = creerService();
    panier.ajouter(THIEB, 1);
    panier.rouvrirApresConnexion();

    connecte.set(utilisateur('CLIENT'));
    TestBed.tick();

    expect(panier.nombreArticles()).toBe(1);
    expect(panier.ouvert()).toBe(true);
  });

  it('la deconnexion vide le panier : le suivant sur le meme ordinateur ne le voit pas', () => {
    connecte.set(utilisateur('CLIENT'));
    const panier = creerService();
    panier.ajouter(THIEB, 1);

    connecte.set(null);
    TestBed.tick();

    expect(panier.nombreArticles()).toBe(0);
    expect(sessionStorage.getItem('saes_panier')).toBeNull();
  });

  it("un membre du personnel n'a pas de panier : il est vide a sa connexion", () => {
    const panier = creerService();
    panier.ajouter(THIEB, 1);

    connecte.set(utilisateur('SERVEUR'));
    TestBed.tick();

    expect(panier.nombreArticles()).toBe(0);
  });
});
