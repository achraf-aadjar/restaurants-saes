import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { motifErreur } from '../../../core/erreur.util';
import { ActionJournal, JournalOperation, JournalService, LIBELLES_ACTIONS } from '../../../core/journal.service';

/** Historique des operations sensibles (caisse, annulations, administration). */
@Component({
  selector: 'app-journal',
  imports: [DatePipe, FormsModule],
  templateUrl: './journal.html',
})
export class Journal {
  private readonly journalService = inject(JournalService);

  protected readonly libelles = LIBELLES_ACTIONS;
  protected readonly objets: Record<string, string> = {
    COMMANDE: 'Commande',
    SESSION_CAISSE: 'Caisse',
    INGREDIENT: 'Ingrédient',
    UTILISATEUR: 'Compte',
    RESTAURANT: 'Restaurant',
  };
  protected readonly actions = Object.keys(LIBELLES_ACTIONS) as ActionJournal[];

  protected readonly entrees = signal<JournalOperation[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly filtre = signal<ActionJournal | ''>('');

  protected readonly entreesAffichees = computed(() => {
    const action = this.filtre();
    return action ? this.entrees().filter((e) => e.action === action) : this.entrees();
  });

  constructor() {
    this.journalService.plusRecentes(500).subscribe({
      next: (entrees) => {
        this.entrees.set(entrees);
        this.chargement.set(false);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, "Impossible de charger l'historique"));
      },
    });
  }
}
