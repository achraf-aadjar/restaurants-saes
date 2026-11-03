import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';

import { CommandeServeurService } from '../../core/commande-serveur.service';
import { motifErreur } from '../../core/erreur.util';
import { OccupationRestaurantDto } from '../../core/models';

/** Visualiser l'occupation des tables (cahier des charges §4.3), cote serveur. */
@Component({
  selector: 'app-occupation-tables',
  imports: [DatePipe],
  templateUrl: './occupation-tables.html',
})
export class OccupationTables {
  private readonly commandeServeurService = inject(CommandeServeurService);

  protected readonly occupation = signal<OccupationRestaurantDto | null>(null);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);

  constructor() {
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
  }
}
