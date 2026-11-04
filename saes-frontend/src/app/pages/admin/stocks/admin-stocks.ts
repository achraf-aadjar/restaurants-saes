import { DecimalPipe, LowerCasePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { motifErreur } from '../../../core/erreur.util';
import { StockSupervision, SupervisionService } from '../../../core/supervision.service';

/** Stocks de tous les restaurants ; les ingrédients en alerte d'abord. */
@Component({
  selector: 'app-admin-stocks',
  imports: [DecimalPipe, LowerCasePipe, FormsModule],
  templateUrl: './admin-stocks.html',
})
export class AdminStocks {
  private readonly supervision = inject(SupervisionService);

  protected readonly stocks = signal<StockSupervision[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly alertesSeulement = signal(false);

  protected readonly affiches = computed(() =>
    this.alertesSeulement() ? this.stocks().filter((s) => s.alerte) : this.stocks(),
  );
  protected readonly enAlerte = computed(() => this.stocks().filter((s) => s.alerte).length);
  protected readonly aCommander = computed(() => this.stocks().filter((s) => s.aReapprovisionner > 0).length);

  constructor() {
    this.supervision.stocks().subscribe({
      next: (s) => {
        this.stocks.set(s);
        this.chargement.set(false);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de charger les stocks'));
      },
    });
  }
}
