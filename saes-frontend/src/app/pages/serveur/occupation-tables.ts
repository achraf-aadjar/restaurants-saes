import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

import { CommandeServeurService } from '../../core/commande-serveur.service';
import { FORMAT_HEURE } from '../../core/date.util';
import { motifErreur } from '../../core/erreur.util';
import { OccupationRestaurantDto, ReservationDto, TableOccupationDto } from '../../core/models';
import { RefusVisible } from '../../shared/refus-visible';

/** Visualiser l'occupation des tables (cahier des charges §4.3), cote serveur. */
@Component({
  selector: 'app-occupation-tables',
  imports: [DatePipe, RefusVisible],
  templateUrl: './occupation-tables.html',
  styleUrl: './occupation-tables.scss',
})
export class OccupationTables {
  private readonly commandeServeurService = inject(CommandeServeurService);

  protected readonly formatHeure = FORMAT_HEURE;
  protected readonly occupation = signal<OccupationRestaurantDto | null>(null);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);

  /**
   * Les tables du restaurant, chacune avec la prochaine reservation du jour qui
   * la retient. Rien n'est calcule de neuf : la reservation vient de la liste
   * deja renvoyee par l'API, elle est seulement rapprochee de sa table.
   */
  protected readonly tables = computed<(TableOccupationDto & { prochaine?: ReservationDto })[]>(
    () => {
      const occ = this.occupation();
      if (!occ) return [];
      const maintenant = Date.now();
      return occ.tables.map((table) => {
        const prochaine = occ.reservationsDuJour
          .filter((r) => r.tables.some((t) => t.numero === table.numero))
          .filter((r) => new Date(r.dateHeure).getTime() >= maintenant)
          .sort((a, b) => a.dateHeure.localeCompare(b.dateHeure))[0];
        return prochaine ? { ...table, prochaine } : { ...table };
      });
    },
  );

  protected readonly nombreOccupees = computed(() => this.tables().filter((t) => t.occupee).length);

  protected readonly nombreLibres = computed(() => this.tables().length - this.nombreOccupees());

  /** Places assises des tables libres : de quoi savoir qui on peut accueillir. */
  protected readonly placesLibres = computed(() =>
    this.tables()
      .filter((t) => !t.occupee)
      .reduce((total, t) => total + t.capacite, 0),
  );

  /** Suite vide de la longueur de la capacite : un couvert dessine par place. */
  protected places(capacite: number): number[] {
    return Array.from({ length: Math.min(capacite, 12) });
  }

  constructor() {
    this.commandeServeurService.occupationTables().subscribe({
      next: (occ) => {
        this.occupation.set(occ);
        this.chargement.set(false);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, "Impossible de charger l'occupation des tables"));
      },
    });
  }
}
