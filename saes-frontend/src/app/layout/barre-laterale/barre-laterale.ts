import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { sectionsDe } from '../../core/navigation';

/**
 * Barre laterale du personnel et de l'administrateur (organisation_travail_sujet17.pdf,
 * Design) : les fonctions de chaque role sous son intitule. Masquee sur
 * telephone, ou les fonctions passent sous le bouton menu de l'en-tete.
 */
@Component({
  selector: 'app-barre-laterale',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './barre-laterale.html',
  styleUrl: './barre-laterale.scss',
  host: { '[class.visible]': 'sections().length > 0' },
})
export class BarreLaterale {
  private readonly auth = inject(AuthService);

  protected readonly sections = computed(() => sectionsDe(this.auth.utilisateur()));
}
