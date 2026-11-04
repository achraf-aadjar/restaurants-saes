import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { motifErreur } from '../../core/erreur.util';
import { GerantRapportService } from '../../core/gerant-rapport.service';
import { RapportFinancierDto } from '../../core/models';
import { MontantPipe } from '../../shared/montant.pipe';
import { RefusVisible } from '../../shared/refus-visible';

function ilYA(jours: number): string {
  const date = new Date();
  date.setDate(date.getDate() - jours);
  return date.toISOString().slice(0, 10);
}

/**
 * Consulter les rapports financiers (cahier des charges §4.5), reserve au
 * gerant : montants encaisses par jour et par mode de paiement, ecarts de
 * caisse et montant des commandes abandonnees, sur une periode.
 */
@Component({
  selector: 'app-gerant-rapports-financiers',
  imports: [FormsModule, DatePipe, MontantPipe, RefusVisible],
  templateUrl: './rapports-financiers.html',
})
export class GerantRapportsFinanciers {
  private readonly gerantRapportService = inject(GerantRapportService);

  protected debut = ilYA(30);
  protected fin = ilYA(0);

  protected readonly rapport = signal<RapportFinancierDto | null>(null);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);

  constructor() {
    this.charger();
  }

  protected charger(): void {
    this.chargement.set(true);
    this.erreur.set(null);
    this.gerantRapportService.consulter(this.debut, this.fin).subscribe({
      next: (rapport) => {
        this.rapport.set(rapport);
        this.chargement.set(false);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de charger le rapport'));
      },
    });
  }
}
