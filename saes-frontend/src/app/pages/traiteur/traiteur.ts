import { Component, inject, signal } from '@angular/core';

import { MenuService } from '../../core/menu.service';
import { SALLE_ALLEE_CENTRALE, SALLE_TABLES_ROUGES, sourcesDe } from '../../core/photos-site';
import { RestaurantSummary } from '../../core/models';

/**
 * Page « Traiteur » : une presentation, sans formulaire et sans fonction
 * metier. Le cahier des charges ne prevoit pas de commande traiteur : les
 * demandes passent par le telephone du restaurant, affiche ici.
 *
 * Cette page est un ajout hors du cahier des charges (voir REFONTE_PLAN.md).
 */
@Component({
  selector: 'app-traiteur',
  templateUrl: './traiteur.html',
  styleUrl: './traiteur.scss',
})
export class Traiteur {
  private readonly menus = inject(MenuService);

  protected readonly restaurant = signal<RestaurantSummary | null>(null);

  protected readonly photoA = sourcesDe(SALLE_TABLES_ROUGES);
  protected readonly dimA = SALLE_TABLES_ROUGES;
  protected readonly photoB = sourcesDe(SALLE_ALLEE_CENTRALE);
  protected readonly dimB = SALLE_ALLEE_CENTRALE;

  /** Les formules ne parlent que des plats de la carte du restaurant. */
  protected readonly formules = [
    {
      titre: 'Buffet',
      texte:
        'Thiéboudienne, yassa poulet et mafé servis en buffet, avec le riz et les sauces. Pour les grandes tablées.',
    },
    {
      titre: 'Plateaux repas',
      texte:
        'Un plat, une boisson et un dessert, prêts à emporter. Pour les séminaires, les soutenances et les journées de travail.',
    },
    {
      titre: 'Boissons et desserts',
      texte:
        'Jus de bissap et de bouye, thiakry : pour accompagner un accueil ou une remise de diplômes.',
    },
  ];

  protected readonly etapes = [
    'Appelez le restaurant avec la date, le lieu et le nombre de personnes.',
    'Le gérant vous confirme la faisabilité et le tarif.',
    "Nous préparons et livrons sur place à l'heure convenue.",
  ];

  constructor() {
    this.menus.restaurants().subscribe({
      next: (liste) => this.restaurant.set(liste[0] ?? null),
      error: () => this.restaurant.set(null),
    });
  }

  protected lienTelephone(telephone: string): string {
    return 'tel:' + telephone.replace(/[^\d+]/g, '');
  }
}
