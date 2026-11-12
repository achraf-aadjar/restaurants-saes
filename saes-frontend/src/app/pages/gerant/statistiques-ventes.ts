import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { motifErreur } from '../../core/erreur.util';
import { GerantStatistiquesService } from '../../core/gerant-statistiques.service';
import { LIBELLES_CATEGORIES, LIBELLES_CATEGORIES_PLURIEL } from '../../core/libelles';
import { StatistiquesVentesDto } from '../../core/models';
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
 * La periode est affichee en texte ; « Changer la periode » ouvre les dates.
 */
@Component({
  selector: 'app-gerant-statistiques-ventes',
  imports: [DatePipe, FormsModule, MontantPipe, RefusVisible],
  templateUrl: './statistiques-ventes.html',
  styleUrl: './statistiques-ventes.scss',
})
export class GerantStatistiquesVentes {
  private readonly gerantStatistiquesService = inject(GerantStatistiquesService);

  protected readonly libellesCategories = LIBELLES_CATEGORIES;
  protected readonly libellesCategoriesPluriel = LIBELLES_CATEGORIES_PLURIEL;

  /** Dates saisies dans le panneau « Changer la periode ». */
  protected debut = ilYA(30);
  protected fin = ilYA(0);

  /** Periode des chiffres affiches. */
  protected readonly debutAffiche = signal(this.debut);
  protected readonly finAffichee = signal(this.fin);
  protected readonly periodeOuverte = signal(false);

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
    this.charger();
  }

  /** Largeur de la barre d'une catégorie, en pourcentage de la plus grande. */
  protected largeurBarre(quantite: number): number {
    return quantite > 0 ? Math.max(4, (quantite / this.quantiteMaximale()) * 100) : 0;
  }

  protected basculerPeriode(): void {
    const ouvrir = !this.periodeOuverte();
    this.periodeOuverte.set(ouvrir);
    if (ouvrir) {
      // Le panneau apparait apres ce cycle : on met le curseur sur la premiere date.
      setTimeout(() => document.getElementById('debutSV')?.focus());
    }
  }

  protected annulerPeriode(): void {
    this.debut = this.debutAffiche();
    this.fin = this.finAffichee();
    this.periodeOuverte.set(false);
  }

  protected charger(): void {
    this.erreur.set(null);
    // Une période incomplète ou inversée donnerait des zéros sans explication.
    if (!this.debut || !this.fin) {
      this.erreur.set('Choisissez la date de début et la date de fin.');
      return;
    }
    if (this.debut > this.fin) {
      this.erreur.set('La date de début doit être avant la date de fin.');
      return;
    }
    this.chargement.set(true);
    this.gerantStatistiquesService.consulter(this.debut, this.fin).subscribe({
      next: (statistiques) => {
        this.statistiques.set(statistiques);
        this.debutAffiche.set(this.debut);
        this.finAffichee.set(this.fin);
        this.periodeOuverte.set(false);
        this.chargement.set(false);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de charger les statistiques'));
      },
    });
  }
}
