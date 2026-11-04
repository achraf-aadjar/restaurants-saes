import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { motifErreur } from '../../../core/erreur.util';
import { SupervisionService, TableauDeBord, ilYA } from '../../../core/supervision.service';
import { GraphiqueBarres } from '../../../shared/graphique-barres';
import { SERIES_ENCAISSEMENTS, pointsParJour } from '../vue-ensemble/vue-ensemble';

/** Finances de tous les restaurants sur une periode choisie. */
@Component({
  selector: 'app-admin-finances',
  imports: [DatePipe, DecimalPipe, FormsModule, GraphiqueBarres],
  templateUrl: './finances.html',
})
export class AdminFinances {
  private readonly supervision = inject(SupervisionService);

  protected readonly series = SERIES_ENCAISSEMENTS;
  protected debut = ilYA(29);
  protected fin = ilYA(0);

  protected readonly donnees = signal<TableauDeBord | null>(null);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);

  protected readonly points = computed(() => pointsParJour(this.donnees()?.finances.parJour ?? []));
  protected readonly joursAvecEncaissement = computed(() =>
    (this.donnees()?.finances.parJour ?? [])
      .filter((j) => j.montantEspeces + j.montantMobileMoney > 0)
      .slice()
      .reverse(),
  );
  protected readonly partEspeces = computed(() => {
    const f = this.donnees()?.finances;
    return f && f.chiffreAffaires > 0 ? Math.round((f.encaisseEspeces / f.chiffreAffaires) * 100) : 0;
  });

  constructor() {
    this.charger();
  }

  protected charger(): void {
    this.chargement.set(true);
    this.erreur.set(null);
    this.supervision.tableauDeBord(this.debut, this.fin).subscribe({
      next: (d) => {
        this.donnees.set(d);
        this.chargement.set(false);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de charger les finances'));
      },
    });
  }
}
