import { Component, inject, signal } from '@angular/core';

import { CommandeServeurService } from '../../core/commande-serveur.service';
import { classeBadgeStatut, LIBELLES_STATUT_COMMANDE } from '../../core/commande.util';
import { motifErreur } from '../../core/erreur.util';
import { CommandeDto, OccupationRestaurantDto } from '../../core/models';

/**
 * Visualiser l'occupation des tables, Modifier ou annuler une commande
 * (cahier des charges §4.3), cote serveur.
 */
@Component({
  selector: 'app-occupation-tables',
  templateUrl: './occupation-tables.html',
})
export class OccupationTables {
  private readonly commandeServeurService = inject(CommandeServeurService);

  protected readonly libelles = LIBELLES_STATUT_COMMANDE;
  protected readonly classeBadge = classeBadgeStatut;

  protected readonly occupation = signal<OccupationRestaurantDto | null>(null);
  protected readonly commandesEnAttente = signal<CommandeDto[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly actionEnCours = signal<number | null>(null);

  constructor() {
    this.charger();
  }

  private charger(): void {
    this.chargement.set(true);
    this.commandeServeurService.occupationTables().subscribe({
      next: (occ) => {
        this.occupation.set(occ);
        this.chargement.set(false);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de charger l\'occupation des tables'));
      },
    });
    this.commandeServeurService.commandesEnAttente().subscribe((commandes) => this.commandesEnAttente.set(commandes));
  }

  protected annuler(commande: CommandeDto): void {
    this.erreur.set(null);
    this.actionEnCours.set(commande.id);
    this.commandeServeurService.annulerCommande(commande.id, { version: commande.version }).subscribe({
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
