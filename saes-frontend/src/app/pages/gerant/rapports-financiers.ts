import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

import { motifErreur } from '../../core/erreur.util';
import { GerantRapportService } from '../../core/gerant-rapport.service';
import { RapportFinancierDto } from '../../core/models';
import { ChiffreCle } from '../../shared/chiffre-cle';
import { ChoixPeriode, Periode } from '../../shared/choix-periode';
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
 * caisse et montant des commandes abandonnees, sur une periode. Meme
 * presentation que les statistiques de ventes (periode, chiffres cles, cartes).
 */
@Component({
  selector: 'app-gerant-rapports-financiers',
  imports: [DatePipe, ChiffreCle, ChoixPeriode, MontantPipe, RefusVisible],
  templateUrl: './rapports-financiers.html',
  styleUrl: './rapports-financiers.scss',
})
export class GerantRapportsFinanciers {
  private readonly gerantRapportService = inject(GerantRapportService);

  /** Période des montants affichés (AAAA-MM-JJ). */
  protected readonly periode = signal<Periode>({ debut: ilYA(30), fin: ilYA(0) });

  protected readonly rapport = signal<RapportFinancierDto | null>(null);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);

  /** Total encaissé sur la période : espèces et Mobile Money de tous les jours. */
  protected readonly totalEncaisse = computed(() =>
    (this.rapport()?.encaissementsParJour ?? []).reduce(
      (total, jour) => total + jour.montantEspeces + jour.montantMobileMoney,
      0,
    ),
  );

  constructor() {
    this.charger(this.periode());
  }

  /** Charge le rapport d'une période ; la période affichée change quand il arrive. */
  protected charger(periode: Periode): void {
    this.erreur.set(null);
    this.chargement.set(true);
    this.gerantRapportService.consulter(periode.debut, periode.fin).subscribe({
      next: (rapport) => {
        this.rapport.set(rapport);
        this.periode.set(periode);
        this.chargement.set(false);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de charger le rapport'));
      },
    });
  }

  /** Montant d'un écart sans son signe : le mot « excédent » ou « manque » le dit. */
  protected ecartAbsolu(ecart: number): number {
    return Math.abs(ecart);
  }
}
