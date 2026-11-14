import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CommandeServeurService } from '../../core/commande-serveur.service';
import { motifErreur } from '../../core/erreur.util';
import { CommandeDto } from '../../core/models';
import { CommandeEntete } from '../../shared/commande-entete';
import { FocusAuRendu } from '../../shared/focus-au-rendu';
import { MontantPipe } from '../../shared/montant.pipe';
import { RefusVisible } from '../../shared/refus-visible';

/** Modifier ou annuler une commande (cahier des charges §4.3), cote serveur. */
@Component({
  selector: 'app-commandes-en-attente',
  imports: [CommandeEntete, FocusAuRendu, MontantPipe, RefusVisible, RouterLink],
  templateUrl: './commandes-en-attente.html',
  styleUrl: './commandes-en-attente.scss',
})
export class CommandesEnAttente {
  private readonly commandeServeurService = inject(CommandeServeurService);

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
    this.commandeServeurService.commandesEnAttente().subscribe({
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

  protected annuler(commande: CommandeDto): void {
    this.erreur.set(null);
    this.actionEnCours.set(commande.id);
    this.commandeServeurService
      .annulerCommande(commande.id, { version: commande.version })
      .subscribe({
        next: () => {
          this.actionEnCours.set(null);
          this.aConfirmer.set(null);
          this.charger();
        },
        error: (err) => {
          this.actionEnCours.set(null);
          this.aConfirmer.set(null);
          this.erreur.set(motifErreur(err, 'Annulation impossible'));
        },
      });
  }

  protected garder(id: number): void {
    this.aConfirmer.set(null);
    this.retourFocus.set(id);
  }
}
