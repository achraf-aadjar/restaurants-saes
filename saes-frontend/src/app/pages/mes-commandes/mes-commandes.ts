import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';

import { CommandeClientService } from '../../core/commande-client.service';
import { classeBadgeStatut, LIBELLES_STATUT_COMMANDE } from '../../core/commande.util';
import { motifErreur } from '../../core/erreur.util';
import { CommandeDto } from '../../core/models';

/** Suivre sa commande, Annuler sa commande (cahier des charges §4.3). */
@Component({
  selector: 'app-mes-commandes',
  imports: [DatePipe],
  templateUrl: './mes-commandes.html',
})
export class MesCommandes {
  private readonly commandeClientService = inject(CommandeClientService);

  protected readonly libelles = LIBELLES_STATUT_COMMANDE;
  protected readonly classeBadge = classeBadgeStatut;

  protected readonly commandes = signal<CommandeDto[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly annulationEnCours = signal<number | null>(null);

  constructor() {
    this.charger();
  }

  private charger(): void {
    this.chargement.set(true);
    this.commandeClientService.suivreCommandes().subscribe({
      next: (commandes) => {
        this.commandes.set(commandes);
        this.chargement.set(false);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de charger vos commandes'));
      },
    });
  }

  protected annuler(commande: CommandeDto): void {
    this.erreur.set(null);
    this.annulationEnCours.set(commande.id);
    this.commandeClientService.annuler(commande.id, { version: commande.version }).subscribe({
      next: () => {
        this.annulationEnCours.set(null);
        this.charger();
      },
      error: (err) => {
        this.annulationEnCours.set(null);
        this.erreur.set(motifErreur(err, 'Annulation impossible'));
        this.charger();
      },
    });
  }
}
