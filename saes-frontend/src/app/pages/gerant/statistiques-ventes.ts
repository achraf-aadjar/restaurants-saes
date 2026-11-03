import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { motifErreur } from '../../core/erreur.util';
import { GerantStatistiquesService } from '../../core/gerant-statistiques.service';
import { StatistiquesVentesDto } from '../../core/models';
import { MontantPipe } from '../../shared/montant.pipe';

function ilYA(jours: number): string {
  const date = new Date();
  date.setDate(date.getDate() - jours);
  return date.toISOString().slice(0, 10);
}

/**
 * Consulter les statistiques de ventes (cahier des charges §4.6), reserve
 * au gerant : nombre de commandes payees et montant moyen, quantites
 * vendues et montants par plat et par categorie, sur une periode.
 */
@Component({
  selector: 'app-gerant-statistiques-ventes',
  imports: [FormsModule, MontantPipe],
  templateUrl: './statistiques-ventes.html',
})
export class GerantStatistiquesVentes {
  private readonly gerantStatistiquesService = inject(GerantStatistiquesService);

  protected debut = ilYA(30);
  protected fin = ilYA(0);

  protected readonly statistiques = signal<StatistiquesVentesDto | null>(null);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);

  constructor() {
    this.charger();
  }

  protected charger(): void {
    this.chargement.set(true);
    this.erreur.set(null);
    this.gerantStatistiquesService.consulter(this.debut, this.fin).subscribe({
      next: (statistiques) => {
        this.statistiques.set(statistiques);
        this.chargement.set(false);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de charger les statistiques'));
      },
    });
  }
}
