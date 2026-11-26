import { Component, computed, inject, signal } from '@angular/core';

import { motifErreur } from '../../core/erreur.util';
import { GerantStatistiquesService } from '../../core/gerant-statistiques.service';
import { LIBELLES_CATEGORIES, LIBELLES_CATEGORIES_PLURIEL } from '../../core/libelles';
import { StatistiquesVentesDto } from '../../core/models';
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
 * Consulter les statistiques de ventes (cahier des charges §4.6), reserve
 * au gerant : nombre de commandes payees et montant moyen, quantites
 * vendues et montants par plat et par categorie, sur une periode.
 * Le choix de la periode est le composant commun `app-choix-periode`.
 */
@Component({
  selector: 'app-gerant-statistiques-ventes',
  imports: [ChiffreCle, ChoixPeriode, Graphique, MontantPipe, RefusVisible],
  templateUrl: './statistiques-ventes.html',
  styleUrl: './statistiques-ventes.scss',
})
export class GerantStatistiquesVentes {
  private readonly gerantStatistiquesService = inject(GerantStatistiquesService);

  protected readonly libellesCategories = LIBELLES_CATEGORIES;
  protected readonly libellesCategoriesPluriel = LIBELLES_CATEGORIES_PLURIEL;

  /**
   * Période des chiffres affichés (AAAA-MM-JJ). Au départ, le mois en cours,
   * du 1er à aujourd'hui, comme sur l'écran de référence 5.
   */
  protected readonly periode = signal<Periode>({ debut: premierDuMois(), fin: ilYA(0) });

  protected readonly statistiques = signal<StatistiquesVentesDto | null>(null);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);

  /**
   * Les catégories de la plus rentable à la moins rentable, comme les plats.
   * La barre mesure le montant, pas la quantité : un jus et un plat n'ont pas
   * le même prix, et des quantités de catégories différentes ne se comparent pas.
   */
  protected readonly categories = computed(() =>
    [...(this.statistiques()?.parCategorie ?? [])].sort((a, b) => b.montant - a.montant),
  );

  /** Les plats du plus rentable au moins rentable. */
  protected readonly plats = computed(() =>
    [...(this.statistiques()?.parPlat ?? [])].sort((a, b) => b.montant - a.montant),
  );

  /** Montant total vendu : la somme des catégories, soit tout ce qui a été payé. */
  protected readonly montantTotal = computed(() =>
    this.categories().reduce((total, v) => total + v.montant, 0),
  );

  /** Les huit plats les plus rentables : au-delà, le graphique devient illisible. */
  protected readonly meilleursPlats = computed(() => this.plats().slice(0, 8));

  protected readonly etiquettesCategories = computed(() =>
    this.categories().map((v) => this.libellesCategoriesPluriel[v.categorie]),
  );

  protected readonly serieCategories = computed<SerieGraphique[]>(() => [
    { libelle: 'Montant vendu', valeurs: this.categories().map((v) => v.montant) },
  ]);

  protected readonly etiquettesMeilleurs = computed(() => this.meilleursPlats().map((v) => v.nom));

  protected readonly serieMeilleurs = computed<SerieGraphique[]>(() => [
    { libelle: 'Montant vendu', valeurs: this.meilleursPlats().map((v) => v.montant) },
  ]);

  /** Montant abrégé des axes et des infobulles : « 190 k FCFA ». */
  protected readonly enFrancs = enFrancsCourt;

  constructor() {
    this.charger(this.periode());
  }

  /** Couleur de la part d'une catégorie, la même que dans le graphique. */
  protected couleur(index: number): string {
    return `var(--saes-serie-${(index % 6) + 1})`;
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
