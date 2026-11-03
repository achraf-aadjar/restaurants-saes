import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { CaisseService } from '../../core/caisse.service';
import { motifErreur } from '../../core/erreur.util';
import { SessionCaisseDto } from '../../core/models';
import { MaCaisse } from './ma-caisse';

/** Ouvrir la caisse (cahier des charges §4.5), cote caissier. */
@Component({
  selector: 'app-ouvrir-caisse',
  imports: [FormsModule, MaCaisse],
  templateUrl: './ouvrir-caisse.html',
})
export class OuvrirCaisse {
  private readonly caisseService = inject(CaisseService);
  private readonly router = inject(Router);

  protected readonly caisseOuverte = signal<SessionCaisseDto | null>(null);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly actionEnCours = signal(false);

  protected fondDeCaisse = 10000;

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

  protected ouvrir(): void {
    this.erreur.set(null);
    this.actionEnCours.set(true);
    this.caisseService.ouvrir({ fondDeCaisse: this.fondDeCaisse }).subscribe({
      next: () => this.router.navigate(['/caissier/encaisser']),
      error: (err) => {
        this.actionEnCours.set(false);
        this.erreur.set(motifErreur(err, "Impossible d'ouvrir la caisse"));
      },
    });
  }
}
