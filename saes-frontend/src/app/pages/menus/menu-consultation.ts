import { Component, computed, inject, signal } from '@angular/core';

import { CategoriePlat, MenuDto, PlatResume, RestaurantSummary } from '../../core/models';
import { MenuService } from '../../core/menu.service';
import { motifErreur } from '../../core/erreur.util';

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

/**
 * Consulter les menus (cahier des charges §4.2) : accessible a toute
 * personne, meme sans compte.
 */
@Component({
  selector: 'app-menu-consultation',
  templateUrl: './menu-consultation.html',
  styleUrl: './menu-consultation.scss',
})
export class MenuConsultation {
  private readonly menuService = inject(MenuService);

  protected readonly restaurants = signal<RestaurantSummary[]>([]);
  protected readonly restaurantSelectionne = signal<RestaurantSummary | null>(null);
  protected readonly menus = signal<MenuDto[]>([]);
  protected readonly chargement = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected readonly groupes = computed<GroupeCategorie[]>(() => {
    const platsParCategorie = new Map<CategoriePlat, PlatResume[]>();
    for (const menu of this.menus()) {
      for (const plat of menu.plats) {
        const liste = platsParCategorie.get(plat.categorie) ?? [];
        if (!liste.some((p) => p.id === plat.id)) {
          liste.push(plat);
        }
        platsParCategorie.set(plat.categorie, liste);
      }
    }
    return ORDRE_CATEGORIES.filter((c) => platsParCategorie.has(c)).map((categorie) => ({
      categorie,
      libelle: LIBELLES_CATEGORIES[categorie],
      plats: platsParCategorie.get(categorie)!,
    }));
  });

  constructor() {
    this.chargement.set(true);
    this.menuService.restaurants().subscribe({
      next: (restaurants) => {
        this.restaurants.set(restaurants);
        if (restaurants.length > 0) {
          this.selectionner(restaurants[0]);
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
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de charger les menus'));
      },
    });
  }
}
