import { Component, computed, inject, signal } from '@angular/core';

import { motifErreur } from '../../core/erreur.util';
import { GerantStatistiquesService } from '../../core/gerant-statistiques.service';
import { LIBELLES_CATEGORIES, LIBELLES_CATEGORIES_PLURIEL } from '../../core/libelles';
import { StatistiquesVentesDto } from '../../core/models';
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
 * Consulter les statistiques de ventes (cahier des charges §4.6), reserve
 * au gerant : nombre de commandes payees et montant moyen, quantites
 * vendues et montants par plat et par categorie, sur une periode.
 * Le choix de la periode est le composant commun `app-choix-periode`.
 */
@Component({
  selector: 'app-gerant-statistiques-ventes',
  imports: [ChiffreCle, ChoixPeriode, MontantPipe, RefusVisible],
  templateUrl: './statistiques-ventes.html',
  styleUrl: './statistiques-ventes.scss',
})
export class GerantStatistiquesVentes {
  private readonly gerantStatistiquesService = inject(GerantStatistiquesService);

  protected readonly libellesCategories = LIBELLES_CATEGORIES;
  protected readonly libellesCategoriesPluriel = LIBELLES_CATEGORIES_PLURIEL;

  /** Période des chiffres affichés (AAAA-MM-JJ). */
  protected readonly periode = signal<Periode>({ debut: ilYA(30), fin: ilYA(0) });

  protected readonly statistiques = signal<StatistiquesVentesDto | null>(null);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);

  /** Les catégories de la plus vendue à la moins vendue (les barres se lisent de haut en bas). */
  protected readonly categories = computed(() =>
    [...(this.statistiques()?.parCategorie ?? [])].sort(
      (a, b) => b.quantiteVendue - a.quantiteVendue,
    ),
  );

  /** Les plats du plus rentable au moins rentable. */
  protected readonly plats = computed(() =>
    [...(this.statistiques()?.parPlat ?? [])].sort((a, b) => b.montant - a.montant),
  );

  /** Plus grande quantité par catégorie : la barre la plus longue la remplit. */
  private readonly quantiteMaximale = computed(() =>
    Math.max(1, ...(this.statistiques()?.parCategorie.map((v) => v.quantiteVendue) ?? [])),
  );

  constructor() {
    this.charger(this.periode());
  }

  /** Largeur de la barre d'une catégorie, en pourcentage de la plus grande. */
  protected largeurBarre(quantite: number): number {
    return quantite > 0 ? Math.max(4, (quantite / this.quantiteMaximale()) * 100) : 0;
  }

  /** Charge les statistiques d'une période ; la période affichée change quand elles arrivent. */
  protected charger(periode: Periode): void {
    this.erreur.set(null);
    this.chargement.set(true);
    this.gerantStatistiquesService.consulter(periode.debut, periode.fin).subscribe({
      next: (statistiques) => {
        this.statistiques.set(statistiques);
        this.periode.set(periode);
        this.chargement.set(false);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de charger les statistiques'));
      },
    });
  }
}
