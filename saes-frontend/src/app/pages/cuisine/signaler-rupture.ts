import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { motifErreur } from '../../core/erreur.util';
import { IngredientDto } from '../../core/models';
import { RuptureService } from '../../core/rupture.service';

/** Signaler une rupture (cahier des charges §4.6), cote cuisinier. */
@Component({
  selector: 'app-signaler-rupture',
  imports: [FormsModule],
  templateUrl: './signaler-rupture.html',
})
export class SignalerRupture {
  private readonly ruptureService = inject(RuptureService);

  protected readonly ingredients = signal<IngredientDto[]>([]);
  protected readonly erreur = signal<string | null>(null);
  protected readonly ruptureEnCours = signal<number | null>(null);
  protected readonly ruptureConfirmee = signal<number | null>(null);
  protected readonly confirmationRupture = signal(false);
  protected ingredientSelectionne: number | null = null;

  protected nomIngredientSelectionne(): string {
    return this.ingredients().find((i) => i.id === this.ingredientSelectionne)?.nom ?? '';
  }

  constructor() {
    this.chargerIngredients();
  }

  private chargerIngredients(): void {
    this.ruptureService.listerIngredients().subscribe({
      next: (ingredients) => {
        this.ingredients.set(ingredients);
        this.ingredientSelectionne = ingredients[0]?.id ?? null;
      },
      error: (err) => this.erreur.set(motifErreur(err, 'Impossible de charger les ingrédients')),
    });
  }

  protected signalerRupture(): void {
    if (this.ingredientSelectionne === null) return;
    this.erreur.set(null);
    this.ruptureConfirmee.set(null);
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
        this.erreur.set(motifErreur(err, 'Action impossible'));
      },
    });
  }
}
