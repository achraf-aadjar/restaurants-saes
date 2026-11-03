import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { MenuService } from '../../core/menu.service';
import { RestaurantSummary } from '../../core/models';

/**
 * Pied de page (organisation_travail_sujet17.pdf, Design). Client ou visiteur :
 * le nom, l'adresse et le telephone du restaurant, « Confidentialite » et le
 * copyright, sur un fond clair different de la page. Personnel et
 * administrateur : une seule ligne discrete.
 */
@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  private readonly auth = inject(AuthService);
  private readonly menuService = inject(MenuService);

  protected readonly annee = new Date().getFullYear();
  protected readonly estConnecte = this.auth.estConnecte;

  /** Premier restaurant actif, affiche tant qu'aucun n'a ete choisi dans la page Menus. */
  private readonly restaurantParDefaut = signal<RestaurantSummary | null>(null);

  protected readonly estClientOuVisiteur = computed(() => {
    const utilisateur = this.auth.utilisateur();
    return !utilisateur || utilisateur.roles.every((role) => role === 'CLIENT');
  });

  protected readonly restaurantAffiche = computed(() =>
    this.estClientOuVisiteur()
      ? (this.menuService.restaurantConsulte() ?? this.restaurantParDefaut())
      : null,
  );

  constructor() {
    // Si l'API ne repond pas, le pied de page reste affiche, sans les coordonnees.
    this.menuService.restaurants().subscribe({
      next: (restaurants) => this.restaurantParDefaut.set(restaurants[0] ?? null),
      error: () => this.restaurantParDefaut.set(null),
    });
  }

  protected lienTelephone(telephone: string): string {
    return 'tel:' + telephone.replace(/[^\d+]/g, '');
  }
}
