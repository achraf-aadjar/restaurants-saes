import { Component, inject, signal } from '@angular/core';

import { classeBadgeStatut, LIBELLES_STATUT_COMMANDE } from '../../core/commande.util';
import { motifErreur } from '../../core/erreur.util';
import { GerantCommandeService } from '../../core/gerant-commande.service';
import { CommandeDto } from '../../core/models';

/** Declarer une commande abandonnee (cahier des charges §4.3), cote gerant. */
@Component({
  selector: 'app-commandes-abandon',
  templateUrl: './commandes-abandon.html',
})
export class CommandesAbandon {
  private readonly gerantCommandeService = inject(GerantCommandeService);

  protected readonly libelles = LIBELLES_STATUT_COMMANDE;
  protected readonly classeBadge = classeBadgeStatut;

  protected readonly commandes = signal<CommandeDto[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly actionEnCours = signal<number | null>(null);
  protected readonly confirmationId = signal<number | null>(null);

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
    this.gerantCommandeService.declarerAbandonnee(commande.id, { version: commande.version }).subscribe({
      next: () => {
        this.actionEnCours.set(null);
        this.confirmationId.set(null);
        this.charger();
      },
      error: (err) => {
        this.actionEnCours.set(null);
        this.erreur.set(motifErreur(err, 'Action impossible'));
        this.charger();
      },
    });
  }
}
