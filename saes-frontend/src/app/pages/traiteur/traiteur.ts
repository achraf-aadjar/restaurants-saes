import { Component, inject, signal } from '@angular/core';

import { MenuService } from '../../core/menu.service';
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

  protected readonly formules = [
    {
      titre: 'Buffet sénégalais',
      texte:
        'Thiéboudienne, yassa et mafé servis en buffet, avec riz, légumes et sauces à part. La formule des grandes tablées.',
    },
    {
      titre: 'Cocktail dînatoire',
      texte:
        'Pastels, fatayas et accras à partager, jus de bissap et de bouye. Pour les accueils et les remises de diplômes.',
    },
    {
      titre: 'Plateaux repas',
      texte:
        'Un plat, une boisson et un dessert, prêts à emporter. Pour les séminaires, les soutenances et les journées de travail.',
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
