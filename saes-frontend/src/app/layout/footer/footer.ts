import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { MenuService } from '../../core/menu.service';

/**
 * Pied de page (organisation_travail_sujet17.pdf, Design). Client ou visiteur :
 * le nom, l'adresse et le telephone du restaurant consulte, « Confidentialite »
 * et le copyright. Personnel et administrateur : une seule ligne discrete.
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

  protected readonly restaurantAffiche = computed(() => {
    const utilisateur = this.auth.utilisateur();
    const estClientOuVisiteur =
      !utilisateur || utilisateur.roles.every((role) => role === 'CLIENT');
    return estClientOuVisiteur ? this.menuService.restaurantConsulte() : null;
  });
}
