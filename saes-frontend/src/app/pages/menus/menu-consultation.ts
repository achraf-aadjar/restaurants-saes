import {
  afterNextRender,
  Component,
  computed,
  inject,
  Injector,
  LOCALE_ID,
  signal,
} from '@angular/core';

import { AuthService } from '../../core/auth.service';
import { periodeEnLettres } from '../../core/date.util';
import { motifErreur } from '../../core/erreur.util';
import { CategoriePlat, MenuDto, PlatResume, RestaurantSummary } from '../../core/models';
import { MenuService } from '../../core/menu.service';
import { PanierService } from '../../core/panier.service';
import { CompteurQuantite } from '../../shared/compteur-quantite';
import { IconeCategorie } from '../../shared/icone-categorie';
import { MontantPipe } from '../../shared/montant.pipe';
import { PhotoPlat } from '../../shared/photo-plat';
import { RefusVisible } from '../../shared/refus-visible';
import { BandeauRestaurant } from './bandeau-restaurant';

const ORDRE_CATEGORIES: CategoriePlat[] = ['ENTREE', 'PLAT_PRINCIPAL', 'DESSERT', 'BOISSON'];
const LIBELLES_CATEGORIES: Record<CategoriePlat, string> = {
  ENTREE: 'Entrées',
  PLAT_PRINCIPAL: 'Plats principaux',
  DESSERT: 'Desserts',
  BOISSON: 'Boissons',
};

interface GroupeCategorie {
  categorie: CategoriePlat;
  libelle: string;
  plats: PlatResume[];
}

interface MenuAffiche {
  menu: MenuDto;
  periode: string;
  groupes: GroupeCategorie[];
}

function grouperParCategorie(plats: PlatResume[]): GroupeCategorie[] {
  return ORDRE_CATEGORIES.map((categorie) => ({
    categorie,
    libelle: LIBELLES_CATEGORIES[categorie],
    plats: plats.filter((plat) => plat.categorie === categorie),
  })).filter((groupe) => groupe.plats.length > 0);
}

/**
 * Consulter les menus (cahier des charges §4.2, accessible sans compte) et
 * remplir le panier pour Passer une commande en ligne (§4.3). Chaque menu en
 * vigueur est affiche avec son nom, ses dates et ses plats actifs, ranges par
 * categorie. « Ajouter » met un plat dans le panier ; la carte montre alors sa
 * quantite (− n +) et un contour rouge. Le panier lui-meme s'ouvre depuis
 * le bouton « Panier » de l'en-tete (voir PanneauPanier).
 */
@Component({
  selector: 'app-menu-consultation',
  imports: [
    BandeauRestaurant,
    CompteurQuantite,
    IconeCategorie,
    MontantPipe,
    PhotoPlat,
    RefusVisible,
  ],
  templateUrl: './menu-consultation.html',
  styleUrl: './menu-consultation.scss',
})
export class MenuConsultation {
  private readonly menuService = inject(MenuService);
  private readonly injector = inject(Injector);
  private readonly locale = inject(LOCALE_ID);
  protected readonly auth = inject(AuthService);
  protected readonly panier = inject(PanierService);

  protected readonly restaurants = signal<RestaurantSummary[]>([]);
  protected readonly restaurantSelectionne = this.menuService.restaurantConsulte;
  protected readonly menus = signal<MenuDto[]>([]);
  protected readonly chargement = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected readonly menusAffiches = computed<MenuAffiche[]>(() =>
    this.menus().map((menu) => ({
      menu,
      periode: periodeEnLettres(menu.dateDebut, menu.dateFin, this.locale),
      groupes: grouperParCategorie(menu.plats),
    })),
  );

  /**
   * L'ecran de reference 1 est celui du client (et du visiteur) : bandeau
   * pleine largeur, decor et bouton « Reserver ». Le personnel, qui a deja son
   * bandeau et sa barre laterale, voit le bandeau dans un cadre.
   */
  protected readonly vueClient = computed(
    () => !this.auth.estConnecte() || this.auth.aLeRole('CLIENT'),
  );

  constructor() {
    this.chargement.set(true);
    this.menuService.restaurants().subscribe({
      next: (restaurants) => {
        this.restaurants.set(restaurants);
        // Le restaurant du panier d'abord : on retrouve ses plats.
        const restaurant =
          restaurants.find((r) => r.id === this.panier.restaurantId()) ?? restaurants[0];
        if (restaurant) {
          this.selectionner(restaurant);
        } else {
          this.chargement.set(false);
        }
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de charger les restaurants'));
      },
    });
  }

  protected selectionner(restaurant: RestaurantSummary): void {
    this.restaurantSelectionne.set(restaurant);
    this.chargement.set(true);
    this.erreur.set(null);
    this.menuService.menusEnVigueur(restaurant.id).subscribe({
      next: (menus) => {
        this.menus.set(menus);
        this.chargement.set(false);
        this.panier.actualiser(
          restaurant.id,
          menus.flatMap((m) => m.plats),
        );
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de charger les menus'));
      },
    });
  }

  /**
   * « Ajouter » : le plat entre dans le panier. Le panier n'a qu'un restaurant
   * a la fois ; s'il contient deja des plats d'un autre, on demande avant de
   * le vider. Le bouton laisse place au compteur : le focus passe sur son « + ».
   */
  protected ajouter(plat: PlatResume, carte: HTMLElement): void {
    const restaurant = this.restaurantSelectionne();
    if (!restaurant) return;
    const autre = this.panier.restaurantId();
    if (autre !== null && autre !== restaurant.id && this.panier.lignes().length > 0) {
      const nomAutre = this.restaurants().find((r) => r.id === autre)?.nom ?? 'un autre restaurant';
      const vider = window.confirm(
        `Votre panier contient des plats de ${nomAutre}. Le vider pour commander ici ?`,
      );
      if (!vider) return;
    }
    this.panier.ajouter(plat, restaurant.id);
    this.focusDans(carte, 'app-compteur-quantite button:last-of-type');
  }

  /** « − » sur la carte : a zero, le compteur redevient « Ajouter », qui prend le focus. */
  protected retirer(plat: PlatResume, carte: HTMLElement): void {
    this.panier.retirer(plat);
    if (this.panier.quantite(plat.id) === 0) this.focusDans(carte, '.btn-ajouter');
  }

  /** Quantite sur la carte : celle du panier, s'il est de ce restaurant. */
  protected quantite(plat: PlatResume): number {
    return this.panier.restaurantId() === this.restaurantSelectionne()?.id
      ? this.panier.quantite(plat.id)
      : 0;
  }

  /** Apres le rendu, le focus va au bouton voulu de la carte du plat. */
  private focusDans(carte: HTMLElement, selecteur: string): void {
    afterNextRender(() => carte.querySelector<HTMLElement>(selecteur)?.focus(), {
      injector: this.injector,
    });
  }
}
