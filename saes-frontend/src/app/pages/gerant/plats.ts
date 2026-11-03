import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { motifErreur } from '../../core/erreur.util';
import { GerantPlatService } from '../../core/gerant-plat.service';
import { GerantStockService } from '../../core/gerant-stock.service';
import { LIBELLES_CATEGORIES, SYMBOLES_UNITES } from '../../core/libelles';
import { CategoriePlat, IngredientDto, PlatGerantDto, PlatSaveRequest, RecetteLigneDto } from '../../core/models';
import { MontantPipe } from '../../shared/montant.pipe';
import { QuantitePipe } from '../../shared/quantite.pipe';

const CATEGORIES: CategoriePlat[] = ['ENTREE', 'PLAT_PRINCIPAL', 'DESSERT', 'BOISSON'];

/**
 * Gerer les plats (cahier des charges §4.2), reserve au gerant : creer,
 * modifier, desactiver ou reactiver les plats de son restaurant, avec leur
 * recette (au moins un ingredient).
 */
@Component({
  selector: 'app-gerant-plats',
  imports: [FormsModule, MontantPipe, QuantitePipe],
  templateUrl: './plats.html',
})
export class GerantPlats {
  private readonly gerantPlatService = inject(GerantPlatService);
  private readonly gerantStockService = inject(GerantStockService);

  protected readonly categories = CATEGORIES;
  protected readonly libellesCategories = LIBELLES_CATEGORIES;
  protected readonly symbolesUnites = SYMBOLES_UNITES;

  protected readonly plats = signal<PlatGerantDto[]>([]);
  protected readonly ingredients = signal<IngredientDto[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly erreurFormulaire = signal<string | null>(null);
  protected readonly enregistrementEnCours = signal(false);
  protected readonly formulaireOuvert = signal(false);

  protected idEnEdition: number | null = null;
  protected nom = '';
  protected description = '';
  protected prix = 0;
  protected categorie: CategoriePlat = 'PLAT_PRINCIPAL';
  protected recette: RecetteLigneDto[] = [];

  constructor() {
    this.charger();
  }

  private charger(): void {
    this.chargement.set(true);
    this.gerantPlatService.lister().subscribe({
      next: (plats) => {
        this.plats.set(plats);
        this.chargement.set(false);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de charger les plats'));
      },
    });
    this.gerantStockService.lister().subscribe({ next: (ingredients) => this.ingredients.set(ingredients) });
  }

  protected ouvrirCreation(): void {
    this.idEnEdition = null;
    this.nom = '';
    this.description = '';
    this.prix = 0;
    this.categorie = 'PLAT_PRINCIPAL';
    this.recette = this.ingredients().length ? [{ ingredientId: this.ingredients()[0].id, quantiteNecessaire: 1 }] : [];
    this.erreurFormulaire.set(null);
    this.formulaireOuvert.set(true);
  }

  protected ouvrirEdition(plat: PlatGerantDto): void {
    this.idEnEdition = plat.id;
    this.nom = plat.nom;
    this.description = plat.description ?? '';
    this.prix = plat.prix;
    this.categorie = plat.categorie;
    this.recette = plat.recette.map((l) => ({ ...l }));
    this.erreurFormulaire.set(null);
    this.formulaireOuvert.set(true);
  }

  protected ajouterLigneRecette(): void {
    if (this.ingredients().length === 0) return;
    this.recette = [...this.recette, { ingredientId: this.ingredients()[0].id, quantiteNecessaire: 1 }];
  }

  protected retirerLigneRecette(index: number): void {
    this.recette = this.recette.filter((_, i) => i !== index);
  }

  protected enregistrer(): void {
    this.erreurFormulaire.set(null);
    if (this.recette.length === 0) {
      this.erreurFormulaire.set('La recette doit contenir au moins un ingrédient');
      return;
    }

    const request: PlatSaveRequest = {
      nom: this.nom,
      description: this.description || undefined,
      prix: this.prix,
      categorie: this.categorie,
      recette: this.recette.map((l) => ({ ingredientId: l.ingredientId, quantiteNecessaire: l.quantiteNecessaire })),
    };

    this.enregistrementEnCours.set(true);
    const appel = this.idEnEdition
      ? this.gerantPlatService.modifier(this.idEnEdition, request)
      : this.gerantPlatService.creer(request);

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

  protected changerActivation(plat: PlatGerantDto): void {
    const action = plat.estActif
      ? this.gerantPlatService.desactiver(plat.id)
      : this.gerantPlatService.activer(plat.id);
    action.subscribe({
      next: () => this.charger(),
      error: (err) => this.erreur.set(motifErreur(err, 'Action impossible')),
    });
  }

  protected nomIngredient(id: number): string {
    return this.ingredients().find((i) => i.id === id)?.nom ?? '';
  }

  /** Unite de l'ingredient, ecrite a cote de la quantite (ecran de reference 4). */
  protected symboleUnite(id: number): string {
    const unite = this.ingredients().find((i) => i.id === id)?.unite;
    return unite ? this.symbolesUnites[unite] : '';
  }
}
