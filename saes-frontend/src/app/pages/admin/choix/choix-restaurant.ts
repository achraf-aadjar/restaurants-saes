import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminRestaurantService } from '../../../core/admin-restaurant.service';
import { heureEnLettres } from '../../../core/date.util';
import { motifErreur } from '../../../core/erreur.util';
import { JourSemaine, RestaurantDto } from '../../../core/models';
import { photoDuRestaurant } from '../../../core/photos-restaurants';
import { RefusVisible } from '../../../shared/refus-visible';

const JOURS_JS: JourSemaine[] = [
  'DIMANCHE',
  'LUNDI',
  'MARDI',
  'MERCREDI',
  'JEUDI',
  'VENDREDI',
  'SAMEDI',
];

/**
 * Premier ecran de l'administrateur : « Quel restaurant voulez-vous voir ? ».
 * Un carre par restaurant, et un carre « Ajouter un restaurant » qui ouvre le
 * formulaire de creation de « Gerer les restaurants » (cahier des charges §4.7).
 *
 * Choisir un restaurant ouvre sa supervision : statistiques, rapports, stocks,
 * recommandations, informations et comptes. C'est un ecart assume au cahier des
 * charges (voir REFONTE_PLAN.md).
 */
@Component({
  selector: 'app-admin-choix-restaurant',
  imports: [RouterLink, RefusVisible],
  templateUrl: './choix-restaurant.html',
  styleUrl: './choix-restaurant.scss',
})
export class ChoixRestaurant {
  private readonly service = inject(AdminRestaurantService);

  protected readonly restaurants = signal<RestaurantDto[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);

  /** Les restaurants actifs d'abord : un restaurant desactive reste visible, en retrait. */
  protected readonly tries = computed(() =>
    [...this.restaurants()].sort(
      (a, b) => Number(b.estActif) - Number(a.estActif) || a.nom.localeCompare(b.nom, 'fr'),
    ),
  );

  constructor() {
    this.service.lister().subscribe({
      next: (restaurants) => {
        this.restaurants.set(restaurants);
        this.chargement.set(false);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de charger les restaurants'));
      },
    });
  }

  protected photo(restaurant: RestaurantDto) {
    return photoDuRestaurant(restaurant.nom);
  }

  protected places(restaurant: RestaurantDto): number {
    return restaurant.tables.reduce((total, t) => total + t.capacite, 0);
  }

  /** Les horaires d'aujourd'hui, ou « Fermé aujourd'hui ». */
  protected horairesDuJour(restaurant: RestaurantDto): string {
    const jour = JOURS_JS[new Date().getDay()];
    const plages = restaurant.horaires
      .filter((h) => h.jour === jour)
      .map((h) =>
        `${heureEnLettres(h.heureOuverture)} – ${heureEnLettres(h.heureFermeture)}`.replace(
          / /g,
          ' ',
        ),
      );
    return plages.length > 0 ? plages.join(' · ') : "Fermé aujourd'hui";
  }
}
