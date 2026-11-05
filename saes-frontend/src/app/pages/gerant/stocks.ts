import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { motifErreur } from '../../core/erreur.util';
import { GerantStockService } from '../../core/gerant-stock.service';
import { LIBELLES_UNITES, SYMBOLES_UNITES } from '../../core/libelles';
import { IngredientDto, IngredientSaveRequest, TypeMouvement, UNITES, Unite } from '../../core/models';
import { QuantitePipe } from '../../shared/quantite.pipe';
import { RefusVisible } from '../../shared/refus-visible';

/**
 * Gerer les stocks (cahier des charges §4.6), reserve au gerant : creer et
 * modifier les ingredients, enregistrer une entree ou une sortie, voir le
 * stock de chaque ingredient. Un stock sous le seuil d'alerte est signale.
 */
@Component({
  selector: 'app-gerant-stocks',
  imports: [FormsModule, QuantitePipe, RefusVisible],
  templateUrl: './stocks.html',
})
export class GerantStocks {
  private readonly gerantStockService = inject(GerantStockService);

  protected readonly unites = UNITES;
  protected readonly libellesUnites = LIBELLES_UNITES;
  protected readonly symbolesUnites = SYMBOLES_UNITES;

  protected readonly ingredients = signal<IngredientDto[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly erreurFormulaire = signal<string | null>(null);
  protected readonly enregistrementEnCours = signal(false);
  protected readonly formulaireOuvert = signal(false);
  protected readonly mouvementIngredientId = signal<number | null>(null);

  protected idEnEdition: number | null = null;
  protected nom = '';
  protected unite: Unite = 'KILOGRAMME';
  protected seuilAlerte = 0;
  protected niveauCible = 0;

  protected typeMouvement: TypeMouvement = 'ENTREE';
  protected quantiteMouvement = 0;

  constructor() {
    this.charger();
  }

  private charger(): void {
    this.chargement.set(true);
    this.gerantStockService.lister().subscribe({
      next: (ingredients) => {
        this.ingredients.set(ingredients);
        this.chargement.set(false);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de charger les stocks'));
      },
    });
  }

  protected ouvrirCreation(): void {
    this.idEnEdition = null;
    this.nom = '';
    this.unite = 'KILOGRAMME';
    this.seuilAlerte = 0;
    this.niveauCible = 0;
    this.erreurFormulaire.set(null);
    this.formulaireOuvert.set(true);
  }

  protected ouvrirEdition(ingredient: IngredientDto): void {
    this.idEnEdition = ingredient.id;
    this.nom = ingredient.nom;
    this.unite = ingredient.unite;
    this.seuilAlerte = ingredient.seuilAlerte;
    this.niveauCible = ingredient.niveauCible;
    this.erreurFormulaire.set(null);
    this.formulaireOuvert.set(true);
  }

  protected enregistrer(): void {
    this.erreurFormulaire.set(null);
    const request: IngredientSaveRequest = {
      nom: this.nom,
      unite: this.unite,
      seuilAlerte: this.seuilAlerte,
      niveauCible: this.niveauCible,
    };

    this.enregistrementEnCours.set(true);
    const appel = this.idEnEdition
      ? this.gerantStockService.modifier(this.idEnEdition, request)
      : this.gerantStockService.creer(request);

    appel.subscribe({
      next: () => {
        this.enregistrementEnCours.set(false);
        this.formulaireOuvert.set(false);
        this.charger();
      },
      error: (err) => {
        this.enregistrementEnCours.set(false);
        this.erreurFormulaire.set(motifErreur(err, 'Enregistrement impossible'));
      },
    });
  }

  protected ouvrirMouvement(ingredient: IngredientDto): void {
    this.mouvementIngredientId.set(ingredient.id);
    this.typeMouvement = 'ENTREE';
    this.quantiteMouvement = 0;
    this.erreurFormulaire.set(null);
  }

  protected enregistrerMouvement(): void {
    const id = this.mouvementIngredientId();
    if (id === null) return;
    this.erreurFormulaire.set(null);
    this.enregistrementEnCours.set(true);
    this.gerantStockService
      .enregistrerMouvement(id, { type: this.typeMouvement, quantite: this.quantiteMouvement })
      .subscribe({
        next: () => {
          this.enregistrementEnCours.set(false);
          this.mouvementIngredientId.set(null);
          this.charger();
        },
        error: (err) => {
          this.enregistrementEnCours.set(false);
          this.erreurFormulaire.set(motifErreur(err, 'Enregistrement impossible'));
        },
      });
  }
}
