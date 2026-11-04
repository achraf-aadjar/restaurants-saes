import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { CaisseService } from '../../core/caisse.service';
import { motifErreur } from '../../core/erreur.util';
import { SessionCaisseDto } from '../../core/models';
import { MontantPipe } from '../../shared/montant.pipe';
import { RefusVisible } from '../../shared/refus-visible';
import { MaCaisse } from './ma-caisse';

/** Cloturer la caisse (cahier des charges §4.5), cote caissier. */
@Component({
  selector: 'app-cloturer-caisse',
  imports: [FormsModule, RouterLink, MaCaisse, MontantPipe, RefusVisible],
  templateUrl: './cloturer-caisse.html',
})
export class CloturerCaisse {
  private readonly caisseService = inject(CaisseService);

  protected readonly caisseOuverte = signal<SessionCaisseDto | null>(null);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly actionEnCours = signal(false);

  protected montantCompte = 0;
  protected readonly resultatCloture = signal<SessionCaisseDto | null>(null);

  constructor() {
    this.caisseService.maSession().subscribe({
      next: (session) => {
        this.caisseOuverte.set(session && !session.dateHeureCloture ? session : null);
        this.chargement.set(false);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de charger la caisse'));
      },
    });
  }

  protected cloturer(): void {
    this.erreur.set(null);
    this.actionEnCours.set(true);
    this.caisseService.cloturer({ montantCompte: this.montantCompte }).subscribe({
      next: (session) => {
        this.actionEnCours.set(false);
        this.caisseOuverte.set(null);
        this.resultatCloture.set(session);
      },
      error: (err) => {
        this.actionEnCours.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de clôturer la caisse'));
      },
    });
  }
}
