import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { heureEnLettres } from '../../core/date.util';
import { motifErreur } from '../../core/erreur.util';
import { LIBELLES_CATEGORIES_PLURIEL, ORDRE_CATEGORIES } from '../../core/libelles';
import { MenuService } from '../../core/menu.service';
import { CategoriePlat, MenuDto, PlatResume, RestaurantSummary } from '../../core/models';
import { PanierService } from '../../core/panier.service';
import { photoDuPlat } from '../../core/photos-plats';
import { ToastService } from '../../core/toast.service';
import { IconeCategorie } from '../../shared/icone-categorie';
import { MontantPipe } from '../../shared/montant.pipe';
import { PhotoPlat } from '../../shared/photo-plat';

interface CategorieVitrine {
  categorie: CategoriePlat;
  libelle: string;
  nombre: number;
}

/**
 * Page d'accueil du visiteur et du client : la vitrine de la plateforme.
 *
 * Elle ne montre que des informations qui viennent du backend (restaurants
 * ouverts, menus en vigueur, plats et prix du jour) et ne propose que les
 * fonctions du cahier des charges : consulter les menus (§4.2), passer une
 * commande a emporter (§4.3) et faire une reservation (§4.4). Le personnel ne
 * la voit pas : il est renvoye vers sa premiere fonction.
 */
@Component({
  selector: 'app-accueil',
  imports: [IconeCategorie, MontantPipe, PhotoPlat, RouterLink],
  templateUrl: './accueil.html',
  styleUrl: './accueil.scss',
})
export class Accueil {
  private readonly menus = inject(MenuService);
  private readonly panier = inject(PanierService);
  private readonly toast = inject(ToastService);
  protected readonly auth = inject(AuthService);

  protected readonly restaurants = signal<RestaurantSummary[]>([]);
  protected readonly menusEnVigueur = signal<MenuDto[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);

  /** Restaurant mis en avant : le premier ouvert, sinon le premier de la liste. */
  protected readonly restaurantVedette = computed(
    () => this.restaurants().find((r) => r.ouvert) ?? this.restaurants()[0] ?? null,
  );

  /** Tous les plats proposes aujourd'hui, sans doublon entre deux menus. */
  protected readonly platsDuJour = computed(() => {
    const vus = new Map<number, PlatResume>();
    for (const menu of this.menusEnVigueur()) {
      for (const plat of menu.plats) vus.set(plat.id, plat);
    }
    return Array.from(vus.values());
  });

  /**
   * Les suggestions mises en avant : les plats qui ont une photo d'abord, pour
   * que la vitrine ne soit pas une suite d'icones, puis les autres. Six au plus.
   */
  protected readonly suggestions = computed(() => {
    const plats = this.platsDuJour();
    const avecPhoto = plats.filter((p) => photoDuPlat(p.nom));
    const sansPhoto = plats.filter((p) => !photoDuPlat(p.nom));
    return [...avecPhoto, ...sansPhoto].slice(0, 6);
  });

  /** Le plat mis en avant dans l'image d'ouverture. */
  protected readonly platVedette = computed(() => this.suggestions()[0] ?? null);

  protected readonly photoVedette = computed(() => {
    const plat = this.platVedette();
    return plat ? photoDuPlat(plat.nom) : null;
  });

  /** Les categories reellement proposees aujourd'hui, avec leur nombre de plats. */
  protected readonly categories = computed<CategorieVitrine[]>(() => {
    const plats = this.platsDuJour();
    return ORDRE_CATEGORIES.map((categorie) => ({
      categorie,
      libelle: LIBELLES_CATEGORIES_PLURIEL[categorie],
      nombre: plats.filter((p) => p.categorie === categorie).length,
    })).filter((c) => c.nombre > 0);
  });

  protected readonly nombreRestaurantsOuverts = computed(
    () => this.restaurants().filter((r) => r.ouvert).length,
  );

  constructor() {
    this.menus.restaurants().subscribe({
      next: (restaurants) => {
        this.restaurants.set(restaurants);
        const vedette = this.restaurantVedette();
        if (!vedette) {
          this.chargement.set(false);
          return;
        }
        this.menus.menusEnVigueur(vedette.id).subscribe({
          next: (menus) => {
            this.menusEnVigueur.set(menus);
            this.chargement.set(false);
          },
          error: (e: unknown) => {
            this.erreur.set(motifErreur(e));
            this.chargement.set(false);
          },
        });
      },
      error: (e: unknown) => {
        this.erreur.set(motifErreur(e));
        this.chargement.set(false);
      },
    });
  }

  /** « 8 h – 21 h », ou « Fermé aujourd'hui » quand aucune plage n'est prevue. */
  protected horaires(restaurant: RestaurantSummary): string {
    const plages = (restaurant.horairesDuJour ?? []).map((h) =>
      `${heureEnLettres(h.heureOuverture)} – ${heureEnLettres(h.heureFermeture)}`.replace(
        / /g,
        ' ',
      ),
    );
    return plages.length > 0 ? plages.join(' · ') : "Fermé aujourd'hui";
  }

  /** Ville du restaurant : les deux derniers elements de l'adresse. */
  protected ville(restaurant: RestaurantSummary): string {
    const parties = (restaurant.adresse ?? '')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    return parties.slice(-2).join(', ');
  }

  /** « Ajouter » depuis la vitrine : le meme panier que la page des menus. */
  protected ajouter(plat: PlatResume): void {
    const restaurant = this.restaurantVedette();
    if (!restaurant) return;
    const autre = this.panier.restaurantId();
    if (autre !== null && autre !== restaurant.id && this.panier.lignes().length > 0) {
      const nomAutre = this.restaurants().find((r) => r.id === autre)?.nom ?? 'un autre restaurant';
      if (
        !window.confirm(
          `Votre panier contient des plats de ${nomAutre}. Le vider pour commander ici ?`,
        )
      ) {
        return;
      }
    }
    this.panier.ajouter(plat, restaurant.id);
    this.toast.afficher(`${plat.nom} ajouté au panier`, {
      libelle: 'Voir le panier',
      executer: () => this.panier.ouvert.set(true),
    });
  }
}
