import { Component, inject, signal } from '@angular/core';

import { motifErreur } from '../../core/erreur.util';
import { GerantCommandeService } from '../../core/gerant-commande.service';
import { CommandeDto } from '../../core/models';
import { CommandeEntete } from '../../shared/commande-entete';
import { FocusAuRendu } from '../../shared/focus-au-rendu';
import { MontantPipe } from '../../shared/montant.pipe';
import { RefusVisible } from '../../shared/refus-visible';

/** Declarer une commande abandonnee (cahier des charges §4.3), cote gerant. */
@Component({
  selector: 'app-commandes-abandon',
  imports: [CommandeEntete, FocusAuRendu, MontantPipe, RefusVisible],
  templateUrl: './commandes-abandon.html',
})
export class CommandesAbandon {
  private readonly gerantCommandeService = inject(GerantCommandeService);

  protected readonly commandes = signal<CommandeDto[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly actionEnCours = signal<number | null>(null);
  /** Carte dont l'action attend la confirmation : le statut obtenu est définitif (règle 1). */
  protected readonly aConfirmer = signal<number | null>(null);
  /** Carte où l'on vient de renoncer : son bouton reprend le focus du clavier. */
  protected readonly retourFocus = signal<number | null>(null);

  constructor() {
    this.charger();
  }

  private charger(): void {
    this.chargement.set(true);
    this.gerantCommandeService.commandesAbandonnables().subscribe({
      next: (commandes) => {
        this.commandes.set(commandes);
        this.chargement.set(false);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de charger les commandes'));
      },
    });
  }

  protected declarerAbandonnee(commande: CommandeDto): void {
    this.erreur.set(null);
    this.actionEnCours.set(commande.id);
    this.gerantCommandeService
      .declarerAbandonnee(commande.id, { version: commande.version })
      .subscribe({
        next: () => {
          this.actionEnCours.set(null);
          this.aConfirmer.set(null);
          this.charger();
        },
        error: (err) => {
          this.actionEnCours.set(null);
          this.aConfirmer.set(null);
          this.erreur.set(motifErreur(err, 'Action impossible'));
          this.charger();
        },
      });
  }

  protected garder(id: number): void {
    this.aConfirmer.set(null);
    this.retourFocus.set(id);
  }
}
