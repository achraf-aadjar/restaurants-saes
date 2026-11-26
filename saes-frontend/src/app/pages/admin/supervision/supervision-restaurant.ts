import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AdminRestaurantService } from '../../../core/admin-restaurant.service';
import { motifErreur } from '../../../core/erreur.util';
import { RestaurantDto } from '../../../core/models';
import { RefusVisible } from '../../../shared/refus-visible';

/**
 * Fiche d'un restaurant pour l'administrateur : un en-tete (nom, etat, retour au
 * choix) et des onglets. Chaque onglet ouvre une page du gerant, en lecture
 * seule, ou la vue d'ensemble et les informations du restaurant.
 *
 * ECART ASSUME au cahier des charges (§4.5 et §4.6 reservent ces consultations
 * au gerant) : voir REFONTE_PLAN.md.
 */
@Component({
  selector: 'app-supervision-restaurant',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, RefusVisible],
  templateUrl: './supervision-restaurant.html',
  styleUrl: './supervision-restaurant.scss',
})
export class SupervisionRestaurant {
  private readonly service = inject(AdminRestaurantService);

  protected readonly restaurant = signal<RestaurantDto | null>(null);
  protected readonly erreur = signal<string | null>(null);

  protected readonly onglets = [
    { lien: '.', libelle: "Vue d'ensemble", exact: true },
    { lien: 'statistiques', libelle: 'Statistiques de ventes', exact: false },
    { lien: 'rapports', libelle: 'Rapports financiers', exact: false },
    { lien: 'stocks', libelle: 'Stocks', exact: false },
    { lien: 'recommandations', libelle: 'Approvisionnement', exact: false },
    { lien: 'informations', libelle: 'Informations et comptes', exact: false },
  ];

  protected readonly id = computed(() => {
    const valeur = this.route.snapshot.paramMap.get('restaurantId');
    return valeur === null ? null : Number(valeur);
  });

  private readonly route = inject(ActivatedRoute);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('restaurantId'));
    this.service.consulter(id).subscribe({
      next: (restaurant) => this.restaurant.set(restaurant),
      error: (err) => this.erreur.set(motifErreur(err, 'Restaurant introuvable')),
    });
  }
}
