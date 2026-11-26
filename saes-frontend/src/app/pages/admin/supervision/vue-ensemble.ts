import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { motifErreur } from '../../../core/erreur.util';
import { GerantRapportService } from '../../../core/gerant-rapport.service';
import { GerantStatistiquesService } from '../../../core/gerant-statistiques.service';
import { GerantStockService } from '../../../core/gerant-stock.service';
import { enFrancsCourt } from '../../../core/montant.util';
import { IngredientDto, RapportFinancierDto, StatistiquesVentesDto } from '../../../core/models';
import { restaurantSupervise } from '../../../core/supervision';
import { ChiffreCle } from '../../../shared/chiffre-cle';
import { Graphique, SerieGraphique } from '../../../shared/graphique';
import { MontantPipe } from '../../../shared/montant.pipe';
import { RefusVisible } from '../../../shared/refus-visible';

function jour(decalage: number): string {
  const date = new Date();
  date.setDate(date.getDate() - decalage);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Vue d'ensemble d'un restaurant pour l'administrateur : les chiffres des
 * trente derniers jours et l'etat des stocks. Ce sont les memes services que
 * ceux du gerant (statistiques, rapports, stocks), en lecture seule.
 */
@Component({
  selector: 'app-supervision-vue-ensemble',
  imports: [ChiffreCle, DatePipe, Graphique, MontantPipe, RefusVisible, RouterLink],
  templateUrl: './vue-ensemble.html',
  styleUrl: './vue-ensemble.scss',
})
export class VueEnsemble {
  private readonly statistiquesService = inject(GerantStatistiquesService);
  private readonly rapportService = inject(GerantRapportService);
  private readonly stockService = inject(GerantStockService);
  protected readonly restaurantId = restaurantSupervise();

  protected readonly debut = jour(29);
  protected readonly fin = jour(0);

  protected readonly statistiques = signal<StatistiquesVentesDto | null>(null);
  protected readonly rapport = signal<RapportFinancierDto | null>(null);
  protected readonly ingredients = signal<IngredientDto[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);

  protected readonly enFrancs = enFrancsCourt;

  protected readonly totalEncaisse = computed(() =>
    (this.rapport()?.encaissementsParJour ?? []).reduce(
      (t, j) => t + j.montantEspeces + j.montantMobileMoney,
      0,
    ),
  );

  protected readonly enAlerte = computed(() => this.ingredients().filter((i) => i.alerte));

  protected readonly joursCourts = computed(() =>
    (this.rapport()?.encaissementsParJour ?? []).map((j) => {
      const [, mois, jourDuMois] = j.jour.split('-');
      return `${jourDuMois}/${mois}`;
    }),
  );

  protected readonly seriesEncaissements = computed<SerieGraphique[]>(() => {
    const jours = this.rapport()?.encaissementsParJour ?? [];
    return [
      { libelle: 'Espèces', valeurs: jours.map((j) => j.montantEspeces), serie: 1 },
      { libelle: 'Mobile Money', valeurs: jours.map((j) => j.montantMobileMoney), serie: 2 },
    ];
  });

  /** Les cinq plats qui ont rapporte le plus. */
  protected readonly meilleurs = computed(() =>
    [...(this.statistiques()?.parPlat ?? [])].sort((a, b) => b.montant - a.montant).slice(0, 5),
  );

  constructor() {
    forkJoin({
      statistiques: this.statistiquesService.consulter(this.debut, this.fin, this.restaurantId),
      rapport: this.rapportService.consulter(this.debut, this.fin, this.restaurantId),
      ingredients: this.stockService.lister(this.restaurantId),
    }).subscribe({
      next: ({ statistiques, rapport, ingredients }) => {
        this.statistiques.set(statistiques);
        this.rapport.set(rapport);
        this.ingredients.set(ingredients);
        this.chargement.set(false);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de charger la vue d’ensemble'));
      },
    });
  }
}
