import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { AuthService } from './auth.service';
import { PlatResume } from './models';

export interface LignePanier {
  plat: PlatResume;
  quantite: number;
}

interface PanierGarde {
  restaurantId: number;
  lignes: LignePanier[];
}

/** Panier de l'onglet : il survit au changement de page et a la connexion. */
const CLE_PANIER = 'saes_panier';
/** Pose par « Passer la commande » d'un visiteur : rouvrir le panier une fois connecte. */
const CLE_ROUVRIR = 'saes_panier_rouvrir';

function lire<T>(cle: string): T | null {
  try {
    const texte = sessionStorage.getItem(cle);
    return texte ? (JSON.parse(texte) as T) : null;
  } catch {
    return null;
  }
}

function ecrire(cle: string, valeur: unknown): void {
  try {
    if (valeur === null) sessionStorage.removeItem(cle);
    else sessionStorage.setItem(cle, JSON.stringify(valeur));
  } catch {
    // Stockage indisponible (navigation privee stricte) : le panier reste en memoire.
  }
}

/**
 * Le panier garde dans l'onglet, s'il est lisible. Un contenu abime (modifie
 * a la main, ancienne version) est ignore au lieu de bloquer l'application.
 */
function panierGarde(): PanierGarde | null {
  const garde = lire<PanierGarde>(CLE_PANIER);
  const valide =
    typeof garde?.restaurantId === 'number' &&
    Array.isArray(garde.lignes) &&
    garde.lignes.every(
      (l) =>
        typeof l?.plat?.id === 'number' &&
        typeof l.plat.prix === 'number' &&
        Number.isInteger(l.quantite) &&
        l.quantite > 0,
    );
  return valide ? garde : null;
}

/**
 * Panier du client (et du visiteur) avant l'envoi de la commande (cahier des
 * charges §4.3, Passer une commande). Il est garde dans l'onglet : changer de
 * page ou se connecter ne le vide plus. Il n'appartient qu'a un restaurant a la
 * fois. Le personnel n'en a pas : il est vide quand un membre du personnel se
 * connecte, et a la deconnexion.
 */
@Injectable({ providedIn: 'root' })
export class PanierService {
  private readonly auth = inject(AuthService);

  private readonly garde = panierGarde();
  private readonly etat = signal<Map<number, LignePanier>>(
    new Map((this.garde?.lignes ?? []).map((l) => [l.plat.id, l])),
  );

  /** Restaurant des plats du panier, null s'il est vide. */
  readonly restaurantId = signal<number | null>(this.garde?.restaurantId ?? null);
  /** Panneau « Votre panier » ouvert. */
  readonly ouvert = signal(false);

  readonly lignes = computed(() => Array.from(this.etat().values()));
  readonly nombreArticles = computed(() => this.lignes().reduce((n, l) => n + l.quantite, 0));
  readonly total = computed(() =>
    this.lignes().reduce((total, l) => total + l.plat.prix * l.quantite, 0),
  );

  constructor() {
    effect(() => {
      const lignes = this.lignes();
      const restaurantId = this.restaurantId();
      ecrire(CLE_PANIER, lignes.length > 0 && restaurantId ? { restaurantId, lignes } : null);
    });

    let precedent = this.auth.utilisateur();
    effect(() => {
      const utilisateur = this.auth.utilisateur();
      if (utilisateur && !utilisateur.roles.includes('CLIENT')) {
        this.vider();
        ecrire(CLE_ROUVRIR, null);
      } else if (precedent && !utilisateur) {
        this.vider();
        this.ouvert.set(false);
      } else if (utilisateur && lire<boolean>(CLE_ROUVRIR)) {
        ecrire(CLE_ROUVRIR, null);
        if (this.lignes().length > 0) this.ouvert.set(true);
      }
      precedent = utilisateur;
    });
  }

  quantite(platId: number): number {
    return this.etat().get(platId)?.quantite ?? 0;
  }

  /** Ajoute un plat ; un plat d'un autre restaurant remplace le panier. */
  ajouter(plat: PlatResume, restaurantId: number): void {
    const copie = this.restaurantId() === restaurantId ? new Map(this.etat()) : new Map();
    copie.set(plat.id, { plat, quantite: (copie.get(plat.id)?.quantite ?? 0) + 1 });
    this.restaurantId.set(restaurantId);
    this.etat.set(copie);
  }

  retirer(plat: PlatResume): void {
    const copie = new Map(this.etat());
    const quantite = copie.get(plat.id)?.quantite ?? 0;
    if (quantite <= 1) copie.delete(plat.id);
    else copie.set(plat.id, { plat, quantite: quantite - 1 });
    this.etat.set(copie);
  }

  /** La corbeille d'une ligne : le plat sort du panier. */
  enlever(plat: PlatResume): void {
    const copie = new Map(this.etat());
    copie.delete(plat.id);
    this.etat.set(copie);
  }

  vider(): void {
    this.etat.set(new Map());
    this.restaurantId.set(null);
  }

  /**
   * Avec les menus en vigueur du restaurant : les plats qui ne sont plus
   * proposes sortent du panier, les autres prennent leur prix du jour.
   */
  actualiser(restaurantId: number, plats: PlatResume[]): void {
    if (this.restaurantId() !== restaurantId) return;
    const proposes = new Map(plats.map((p) => [p.id, p]));
    const copie = new Map<number, LignePanier>();
    for (const ligne of this.lignes()) {
      const plat = proposes.get(ligne.plat.id);
      if (plat) copie.set(plat.id, { plat, quantite: ligne.quantite });
    }
    this.etat.set(copie);
  }

  /** « Passer la commande » d'un visiteur : le panier se rouvrira une fois connecte. */
  rouvrirApresConnexion(): void {
    ecrire(CLE_ROUVRIR, true);
  }
}
