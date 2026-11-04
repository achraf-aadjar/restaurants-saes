import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { LIBELLES_STATUT_COMMANDE, classeBadgeStatut } from '../../../core/commande.util';
import { motifErreur } from '../../../core/erreur.util';
import { StatutCommande } from '../../../core/models';
import { CommandeSupervision, LIBELLES_MODES, SupervisionService, ilYA } from '../../../core/supervision.service';

/** Toutes les commandes de tous les restaurants, en lecture. */
@Component({
  selector: 'app-admin-commandes',
  imports: [DatePipe, DecimalPipe, FormsModule],
  templateUrl: './admin-commandes.html',
})
export class AdminCommandes {
  private readonly supervision = inject(SupervisionService);

  protected readonly libelles = LIBELLES_STATUT_COMMANDE;
  protected readonly modes = LIBELLES_MODES;
  protected readonly classeBadge = classeBadgeStatut;
  protected readonly statuts = Object.keys(LIBELLES_STATUT_COMMANDE) as StatutCommande[];

  protected debut = ilYA(6);
  protected fin = ilYA(0);
  protected readonly commandes = signal<CommandeSupervision[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly filtreStatut = signal<StatutCommande | ''>('');
  protected readonly filtreRestaurant = signal('');

  protected readonly restaurants = computed(() => [...new Set(this.commandes().map((c) => c.restaurant))].sort());
  protected readonly affichees = computed(() =>
    this.commandes().filter(
      (c) =>
        (!this.filtreStatut() || c.statut === this.filtreStatut()) &&
        (!this.filtreRestaurant() || c.restaurant === this.filtreRestaurant()),
    ),
  );
  protected readonly total = computed(() =>
    this.affichees().filter((c) => c.statut === 'PAYEE').reduce((a, c) => a + c.montantTotal, 0),
  );

  constructor() {
    this.charger();
  }

  protected charger(): void {
    this.chargement.set(true);
    this.erreur.set(null);
    this.supervision.commandes(this.debut, this.fin).subscribe({
      next: (c) => {
        this.commandes.set(c);
        this.chargement.set(false);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de charger les commandes'));
      },
    });
  }
}
