import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { classeBadgeStatut, LIBELLES_STATUT_COMMANDE } from '../../core/commande.util';
import { CuisineService } from '../../core/cuisine.service';
import { motifErreur } from '../../core/erreur.util';
import { CommandeDto, IngredientDto } from '../../core/models';
import { RuptureService } from '../../core/rupture.service';

/**
 * Gerer la preparation des commandes (cahier des charges §4.3) et Signaler
 * une rupture (§4.6), cote cuisinier.
 */
@Component({
  selector: 'app-cuisine',
  imports: [FormsModule],
  templateUrl: './cuisine.html',
})
export class Cuisine {
  private readonly cuisineService = inject(CuisineService);
  private readonly ruptureService = inject(RuptureService);

  protected readonly libelles = LIBELLES_STATUT_COMMANDE;
  protected readonly classeBadge = classeBadgeStatut;

  protected readonly commandes = signal<CommandeDto[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly actionEnCours = signal<number | null>(null);

  protected readonly ingredients = signal<IngredientDto[]>([]);
  protected readonly erreurRupture = signal<string | null>(null);
  protected readonly ruptureEnCours = signal<number | null>(null);
  protected readonly ruptureConfirmee = signal<number | null>(null);
  protected readonly confirmationRupture = signal(false);
  protected ingredientSelectionne: number | null = null;

  protected nomIngredientSelectionne(): string {
    return this.ingredients().find((i) => i.id === this.ingredientSelectionne)?.nom ?? '';
  }

  constructor() {
    this.charger();
    this.chargerIngredients();
  }

  private chargerIngredients(): void {
    this.ruptureService.listerIngredients().subscribe({
      next: (ingredients) => {
        this.ingredients.set(ingredients);
        this.ingredientSelectionne = ingredients[0]?.id ?? null;
      },
    });
  }

  protected signalerRupture(): void {
    if (this.ingredientSelectionne === null) return;
    this.erreurRupture.set(null);
    this.ruptureEnCours.set(this.ingredientSelectionne);
    this.ruptureService.signaler(this.ingredientSelectionne).subscribe({
      next: () => {
        this.ruptureEnCours.set(null);
        this.confirmationRupture.set(false);
        this.ruptureConfirmee.set(this.ingredientSelectionne);
        this.chargerIngredients();
      },
      error: (err) => {
        this.ruptureEnCours.set(null);
        this.confirmationRupture.set(false);
        this.erreurRupture.set(motifErreur(err, 'Action impossible'));
      },
    });
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
