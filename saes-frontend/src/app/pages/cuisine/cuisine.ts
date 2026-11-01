import { Component, inject, signal } from '@angular/core';

import { classeBadgeStatut, LIBELLES_STATUT_COMMANDE } from '../../core/commande.util';
import { CuisineService } from '../../core/cuisine.service';
import { motifErreur } from '../../core/erreur.util';
import { CommandeDto } from '../../core/models';

/** Gerer la preparation des commandes (cahier des charges §4.3), cote cuisinier. */
@Component({
  selector: 'app-cuisine',
  templateUrl: './cuisine.html',
})
export class Cuisine {
  private readonly cuisineService = inject(CuisineService);

  protected readonly libelles = LIBELLES_STATUT_COMMANDE;
  protected readonly classeBadge = classeBadgeStatut;

  protected readonly commandes = signal<CommandeDto[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly actionEnCours = signal<number | null>(null);

  constructor() {
    this.charger();
  }

  private charger(): void {
    this.chargement.set(true);
    this.cuisineService.commandesAPreparer().subscribe({
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

  protected demarrer(commande: CommandeDto): void {
    this.erreur.set(null);
    this.actionEnCours.set(commande.id);
    this.cuisineService.demarrer(commande.id, { version: commande.version }).subscribe({
      next: () => {
        this.actionEnCours.set(null);
        this.charger();
      },
      error: (err) => {
        this.actionEnCours.set(null);
        this.erreur.set(motifErreur(err, 'Action impossible'));
        this.charger();
      },
    });
  }

  protected terminer(commande: CommandeDto): void {
    this.erreur.set(null);
    this.actionEnCours.set(commande.id);
    this.cuisineService.terminer(commande.id, { version: commande.version }).subscribe({
      next: () => {
        this.actionEnCours.set(null);
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
