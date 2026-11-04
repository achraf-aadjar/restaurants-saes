import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

import { motifErreur } from '../../../core/erreur.util';
import { CaisseSupervision, SupervisionService } from '../../../core/supervision.service';

/** Caisses ouvertes et clôturées de tous les restaurants, avec leurs écarts. */
@Component({
  selector: 'app-admin-caisses',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './admin-caisses.html',
})
export class AdminCaisses {
  private readonly supervision = inject(SupervisionService);

  protected readonly caisses = signal<CaisseSupervision[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);

  protected readonly ouvertes = computed(() => this.caisses().filter((c) => !c.cloture));
  protected readonly ecartTotal = computed(() => this.caisses().reduce((a, c) => a + (c.ecart ?? 0), 0));
  protected readonly avecEcart = computed(() => this.caisses().filter((c) => (c.ecart ?? 0) !== 0).length);

  constructor() {
    this.supervision.caisses().subscribe({
      next: (c) => {
        this.caisses.set(c);
        this.chargement.set(false);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de charger les caisses'));
      },
    });
  }
}
