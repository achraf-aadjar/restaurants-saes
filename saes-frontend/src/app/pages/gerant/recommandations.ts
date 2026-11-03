import { Component, inject, signal } from '@angular/core';

import { motifErreur } from '../../core/erreur.util';
import { RecommandationDto } from '../../core/models';
import { RecommandationService } from '../../core/recommandation.service';

/**
 * Consulter les recommandations d'approvisionnement (cahier des charges
 * §4.6), reserve au gerant.
 */
@Component({
  selector: 'app-gerant-recommandations',
  templateUrl: './recommandations.html',
})
export class GerantRecommandations {
  private readonly recommandationService = inject(RecommandationService);

  protected readonly recommandations = signal<RecommandationDto[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);

  constructor() {
    this.recommandationService.lister().subscribe({
      next: (recommandations) => {
        this.recommandations.set(recommandations);
        this.chargement.set(false);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de charger les recommandations'));
      },
    });
  }
}
