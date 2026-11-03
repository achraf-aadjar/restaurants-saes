import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { CommandeClientService } from '../../core/commande-client.service';
import { motifErreur } from '../../core/erreur.util';
import { CategoriePlat, MenuDto, PlatResume, RestaurantSummary } from '../../core/models';
import { MenuService } from '../../core/menu.service';
import { MontantPipe } from '../../shared/montant.pipe';

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

interface LignePanier {
  plat: PlatResume;
  quantite: number;
}

interface MenuAffiche {
  menu: MenuDto;
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
 * Consulter les menus (cahier des charges §4.2, accessible sans compte) et,
 * pour un client connecte, Passer une commande en ligne (§4.3). Chaque menu
 * en vigueur est affiche avec son nom, ses dates et ses plats actifs, ranges
 * par categorie.
 */
@Component({
  selector: 'app-menu-consultation',
  imports: [DatePipe, MontantPipe],
  templateUrl: './menu-consultation.html',
  styleUrl: './menu-consultation.scss',
})
export class MenuConsultation {
  private readonly menuService = inject(MenuService);
  private readonly commandeClientService = inject(CommandeClientService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly restaurants = signal<RestaurantSummary[]>([]);
  protected readonly restaurantSelectionne = this.menuService.restaurantConsulte;
  protected readonly menus = signal<MenuDto[]>([]);
  protected readonly chargement = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected readonly panier = signal<Map<number, LignePanier>>(new Map());
  protected readonly envoiEnCours = signal(false);
  protected readonly erreurCommande = signal<string | null>(null);
  protected readonly commandeConfirmee = signal(false);

  protected readonly menusAffiches = computed<MenuAffiche[]>(() =>
    this.menus().map((menu) => ({ menu, groupes: grouperParCategorie(menu.plats) })),
  );

  protected readonly lignesPanier = computed(() => Array.from(this.panier().values()));
  protected readonly totalPanier = computed(() =>
    this.lignesPanier().reduce((total, l) => total + l.plat.prix * l.quantite, 0),
  );

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
    this.panier.set(new Map());
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

  protected quantiteDans(plat: PlatResume): number {
    return this.panier().get(plat.id)?.quantite ?? 0;
  }

  protected ajouter(plat: PlatResume): void {
    const copie = new Map(this.panier());
    const existant = copie.get(plat.id);
    copie.set(plat.id, { plat, quantite: (existant?.quantite ?? 0) + 1 });
    this.panier.set(copie);
  }

  protected retirer(plat: PlatResume): void {
    const copie = new Map(this.panier());
    const existant = copie.get(plat.id);
    if (!existant) return;
    if (existant.quantite <= 1) {
      copie.delete(plat.id);
    } else {
      copie.set(plat.id, { plat, quantite: existant.quantite - 1 });
    }
    this.panier.set(copie);
  }

  protected passerCommande(): void {
    const restaurant = this.restaurantSelectionne();
    if (!restaurant || this.lignesPanier().length === 0) return;

    this.erreurCommande.set(null);
    this.envoiEnCours.set(true);
    this.commandeClientService
      .passerCommande({
        restaurantId: restaurant.id,
        lignes: this.lignesPanier().map((l) => ({ platId: l.plat.id, quantite: l.quantite })),
      })
      .subscribe({
        next: () => {
          this.envoiEnCours.set(false);
          this.panier.set(new Map());
          this.commandeConfirmee.set(true);
        },
        error: (err) => {
          this.envoiEnCours.set(false);
          this.erreurCommande.set(motifErreur(err, 'La commande n\'a pas pu être enregistrée'));
        },
      });
  }

  protected voirMesCommandes(): void {
    this.router.navigate(['/mes-commandes']);
  }
}
