import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

import { motifErreur } from '../../core/erreur.util';
import { GerantRapportService } from '../../core/gerant-rapport.service';
import { RapportFinancierDto } from '../../core/models';
import { ChiffreCle } from '../../shared/chiffre-cle';
import { ChoixPeriode, Periode } from '../../shared/choix-periode';
import { Graphique, SerieGraphique } from '../../shared/graphique';
import { enFrancsCourt } from '../../core/montant.util';
import { MontantPipe } from '../../shared/montant.pipe';
import { RefusVisible } from '../../shared/refus-visible';

function ilYA(jours: number): string {
  const date = new Date();
  date.setDate(date.getDate() - jours);
  return date.toISOString().slice(0, 10);
}

/** Le 1er du mois en cours (AAAA-MM-JJ). */
function premierDuMois(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

/**
 * Consulter les rapports financiers (cahier des charges §4.5), reserve au
 * gerant : montants encaisses par jour et par mode de paiement, ecarts de
 * caisse et montant des commandes abandonnees, sur une periode. Meme
 * presentation que les statistiques de ventes (periode, chiffres cles, cartes).
 */
@Component({
  selector: 'app-gerant-rapports-financiers',
  imports: [DatePipe, ChiffreCle, ChoixPeriode, Graphique, MontantPipe, RefusVisible],
  templateUrl: './rapports-financiers.html',
  styleUrl: './rapports-financiers.scss',
})
export class GerantRapportsFinanciers {
  private readonly gerantRapportService = inject(GerantRapportService);

  /**
   * Période des montants affichés (AAAA-MM-JJ). Au départ, le mois en cours,
   * du 1er à aujourd'hui, comme sur l'écran de référence 5.
   */
  protected readonly periode = signal<Periode>({ debut: premierDuMois(), fin: ilYA(0) });

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

  /** Total encaissé en espèces, et total par Mobile Money, sur la période. */
  protected readonly totalEspeces = computed(() =>
    (this.rapport()?.encaissementsParJour ?? []).reduce((t, j) => t + j.montantEspeces, 0),
  );

  protected readonly totalMobileMoney = computed(() =>
    (this.rapport()?.encaissementsParJour ?? []).reduce((t, j) => t + j.montantMobileMoney, 0),
  );

  /** Somme des écarts de caisse de la période : positif = excédent. */
  protected readonly totalEcarts = computed(() =>
    (this.rapport()?.ecartsCaisse ?? []).reduce((t, c) => t + c.ecart, 0),
  );

  /** « 03/11 » : l'axe du graphique n'a pas la place de l'année. */
  protected readonly joursCourts = computed(() =>
    (this.rapport()?.encaissementsParJour ?? []).map((j) => {
      const [, mois, jour] = j.jour.split('-');
      return `${jour}/${mois}`;
    }),
  );

  /**
   * Deux séries empilées : la hauteur d'une barre est le total encaissé du
   * jour, et ses deux parts sont les deux modes de paiement.
   */
  protected readonly seriesEncaissements = computed<SerieGraphique[]>(() => {
    const jours = this.rapport()?.encaissementsParJour ?? [];
    return [
      { libelle: 'Espèces', valeurs: jours.map((j) => j.montantEspeces), serie: 1 },
      { libelle: 'Mobile Money', valeurs: jours.map((j) => j.montantMobileMoney), serie: 2 },
    ];
  });

  protected readonly etiquettesModes = ['Espèces', 'Mobile Money'];

  protected readonly serieModes = computed<SerieGraphique[]>(() => [
    {
      libelle: 'Montant encaissé',
      valeurs: [this.totalEspeces(), this.totalMobileMoney()],
    },
  ]);

  /** Écart de chaque caisse clôturée, dans l'ordre des clôtures. */
  protected readonly etiquettesEcarts = computed(() =>
    (this.rapport()?.ecartsCaisse ?? []).map((c) => {
      const date = new Date(c.dateHeureCloture);
      return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
    }),
  );

  protected readonly serieEcarts = computed<SerieGraphique[]>(() => [
    {
      libelle: 'Écart constaté',
      valeurs: (this.rapport()?.ecartsCaisse ?? []).map((c) => c.ecart),
      serie: 5,
    },
  ]);

  protected readonly enFrancs = enFrancsCourt;

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
