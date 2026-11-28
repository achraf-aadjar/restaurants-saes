import { toSignal } from '@angular/core/rxjs-interop';
import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';

import { AuthService } from '../../core/auth.service';
import { heureEnLettres } from '../../core/date.util';
import { MenuService } from '../../core/menu.service';
import { RestaurantSummary } from '../../core/models';

/**
 * Pied de page (organisation_travail_sujet17.pdf, Design). Client ou visiteur :
 * le nom, l'adresse et le telephone du restaurant, « Confidentialite » et le
 * copyright. Personnel : une seule ligne discrete. Pour tous, un fond clair
 * different de la page.
 */
@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Adresse de la page affichee (sans les parametres). */
  private readonly adresse = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects.split('?')[0]),
    ),
    { initialValue: this.router.url.split('?')[0] },
  );

  /**
   * Ecrans d'un seul geste (compte, reservations) : ils
   * doivent tenir dans la fenetre, sans defiler. Le grand pied de page bleu nuit
   * y est remplace par une ligne discrete.
   */
  protected readonly ecranUnique = computed(() =>
    ['/mon-compte', '/mes-reservations'].some((p) => this.adresse().startsWith(p)),
  );
  private readonly menuService = inject(MenuService);

  protected readonly annee = new Date().getFullYear();

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

  protected readonly estConnecte = computed(() => this.auth.estConnecte());

  /** « 8 h – 21 h », ou vide quand le restaurant est fermé aujourd'hui. */
  protected readonly horairesDuJour = computed(() =>
    (this.restaurantAffiche()?.horairesDuJour ?? [])
      .map((h) =>
        `${heureEnLettres(h.heureOuverture)} – ${heureEnLettres(h.heureFermeture)}`.replace(
          / /g,
          '\u00a0',
        ),
      )
      .join(' · '),
  );

  protected lienTelephone(telephone: string): string {
    return 'tel:' + telephone.replace(/[^\d+]/g, '');
  }
}
