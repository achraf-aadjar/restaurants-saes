import { Component, inject, signal } from '@angular/core';

import { CommandeServeurService } from '../../core/commande-serveur.service';
import { motifErreur } from '../../core/erreur.util';
import { CommandeDto } from '../../core/models';
import { CommandeEntete } from '../../shared/commande-entete';
import { MontantPipe } from '../../shared/montant.pipe';

/** Modifier ou annuler une commande (cahier des charges §4.3), cote serveur. */
@Component({
  selector: 'app-commandes-en-attente',
  imports: [CommandeEntete, MontantPipe],
  templateUrl: './commandes-en-attente.html',
})
export class CommandesEnAttente {
  private readonly commandeServeurService = inject(CommandeServeurService);

  protected readonly commandes = signal<CommandeDto[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly actionEnCours = signal<number | null>(null);

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
          this.charger();
        },
        error: (err) => {
          this.actionEnCours.set(null);
          this.erreur.set(motifErreur(err, 'Annulation impossible'));
        },
      });
  }
}
