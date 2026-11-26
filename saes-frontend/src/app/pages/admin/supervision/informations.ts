import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AdminRestaurantService } from '../../../core/admin-restaurant.service';
import { AdminUserService } from '../../../core/admin-user.service';
import { motifErreur } from '../../../core/erreur.util';
import { LIBELLES_JOURS, LIBELLES_ROLES } from '../../../core/libelles';
import { JOURS_SEMAINE, RestaurantDto, Utilisateur } from '../../../core/models';
import { restaurantSupervise } from '../../../core/supervision';
import { RefusVisible } from '../../../shared/refus-visible';

/**
 * Informations d'un restaurant pour l'administrateur : ses tables, ses horaires
 * et les comptes qui y sont rattaches. La modification passe par « Gerer les
 * restaurants » et « Gerer les comptes utilisateurs » (cahier des charges §4.7).
 */
@Component({
  selector: 'app-supervision-informations',
  imports: [RefusVisible, RouterLink],
  templateUrl: './informations.html',
  styleUrl: './informations.scss',
})
export class Informations {
  private readonly restaurants = inject(AdminRestaurantService);
  private readonly utilisateurs = inject(AdminUserService);
  private readonly id = restaurantSupervise();

  protected readonly libellesRoles = LIBELLES_ROLES;
  protected readonly libellesJours = LIBELLES_JOURS;

  protected readonly restaurant = signal<RestaurantDto | null>(null);
  protected readonly personnel = signal<Utilisateur[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);

  /** Les horaires dans l'ordre de la semaine, un jour sans plage etant ferme. */
  protected readonly semaine = computed(() => {
    const horaires = this.restaurant()?.horaires ?? [];
    return JOURS_SEMAINE.map((jour) => ({
      jour,
      plages: horaires
        .filter((h) => h.jour === jour)
        .map((h) => `${h.heureOuverture.slice(0, 5)} – ${h.heureFermeture.slice(0, 5)}`),
    }));
  });

  protected readonly places = computed(() =>
    (this.restaurant()?.tables ?? []).reduce((total, t) => total + t.capacite, 0),
  );

  constructor() {
    forkJoin({
      restaurant: this.restaurants.consulter(this.id ?? 0),
      utilisateurs: this.utilisateurs.lister(),
    }).subscribe({
      next: ({ restaurant, utilisateurs }) => {
        this.restaurant.set(restaurant);
        this.personnel.set(utilisateurs.filter((u) => u.restaurantId === restaurant.id));
        this.chargement.set(false);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de charger les informations'));
      },
    });
  }
}
