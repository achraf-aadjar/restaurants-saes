import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { motifErreur } from '../../core/erreur.util';
import { GerantStockService } from '../../core/gerant-stock.service';
import { LIBELLES_UNITES, SYMBOLES_UNITES } from '../../core/libelles';
import {
  IngredientDto,
  IngredientSaveRequest,
  TypeMouvement,
  UNITES,
  Unite,
} from '../../core/models';
import { QuantitePipe } from '../../shared/quantite.pipe';
import { RefusVisible } from '../../shared/refus-visible';
import { SuiviFormulaire, amenerALEcran, focusDans } from '../../shared/suivi-formulaire';

/**
 * Gerer les stocks (cahier des charges §4.6), reserve au gerant : creer et
 * modifier les ingredients, enregistrer une entree ou une sortie, voir le
 * stock de chaque ingredient. Un stock sous le seuil d'alerte est signale.
 */
@Component({
  selector: 'app-gerant-stocks',
  imports: [FormsModule, QuantitePipe, RefusVisible],
  templateUrl: './stocks.html',
  styleUrl: './stocks.scss',
  host: { '(document:keydown.escape)': 'echap($event)' },
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

  /**
   * Les ingredients dont le stock est sous leur seuil d'alerte : le cahier des
   * charges demande qu'ils soient signales au gerant (§4.6).
   */
  protected readonly enAlerte = computed(() => this.ingredients().filter((i) => i.alerte));

  /**
   * Remplissage de la jauge d'un ingredient : son stock rapporte a son niveau
   * cible. Un stock negatif (regle 10) est montre vide ; un stock au-dessus de
   * la cible remplit la jauge entierement.
   */
  protected remplissage(stock: number, niveauCible: number): number {
    if (niveauCible <= 0) return 0;
    return Math.max(0, Math.min(100, (stock / niveauCible) * 100));
  }

  protected idEnEdition: number | null = null;
  protected nom = '';
  protected unite: Unite = 'KILOGRAMME';
  protected seuilAlerte = 0;
  protected niveauCible = 0;

  protected typeMouvement: TypeMouvement = 'ENTREE';
  protected quantiteMouvement = 0;

  private readonly suivi = new SuiviFormulaire();
  private readonly suiviMouvement = new SuiviFormulaire();

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
    if (this.formulaireOuvert() && this.idEnEdition === null) {
      this.fermer();
      return;
    }
    if (this.formulaireOuvert() && !this.suivi.peutFermer(this.etat())) return;
    this.idEnEdition = null;
    this.nom = '';
    this.unite = 'KILOGRAMME';
    this.seuilAlerte = 0;
    this.niveauCible = 0;
    this.erreurFormulaire.set(null);
    this.formulaireOuvert.set(true);
    this.suivi.ouvert(this.etat());
    amenerALEcran('.formulaire-ingredient');
  }

  protected ouvrirEdition(ingredient: IngredientDto): void {
    if (this.formulaireOuvert() && this.idEnEdition === ingredient.id) {
      this.fermer();
      return;
    }
    if (this.formulaireOuvert() && !this.suivi.peutFermer(this.etat())) return;
    this.idEnEdition = ingredient.id;
    this.nom = ingredient.nom;
    this.unite = ingredient.unite;
    this.seuilAlerte = ingredient.seuilAlerte;
    this.niveauCible = ingredient.niveauCible;
    this.erreurFormulaire.set(null);
    this.formulaireOuvert.set(true);
    this.suivi.ouvert(this.etat());
    amenerALEcran('.formulaire-ingredient');
  }

  /** Valeurs du formulaire : pour savoir s'il a été modifié avant de le fermer. */
  private etat(): unknown {
    return [this.idEnEdition, this.nom, this.unite, this.seuilAlerte, this.niveauCible];
  }

  private etatMouvement(): unknown {
    return [this.mouvementIngredientId(), this.typeMouvement, this.quantiteMouvement];
  }

  protected annulerMouvement(): void {
    this.mouvementIngredientId.set(null);
    this.suiviMouvement.rendreFocus();
  }

  private fermerMouvement(): void {
    if (this.mouvementIngredientId() === null) return;
    if (!this.suiviMouvement.peutFermer(this.etatMouvement())) return;
    this.annulerMouvement();
  }

  /** « Annuler » : on renonce, sans question. */
  protected annuler(): void {
    this.formulaireOuvert.set(false);
    this.suivi.rendreFocus();
  }

  /** Échap ou second clic : confirmation si le formulaire a été modifié. */
  protected fermer(): void {
    if (!this.formulaireOuvert() || !this.suivi.peutFermer(this.etat())) return;
    this.annuler();
  }

  /**
   * Échap ferme le formulaire où l'on se trouve ; ailleurs dans la page, le
   * mouvement d'abord (il est dans sa ligne), puis l'ingrédient.
   */
  protected echap(event: Event): void {
    if (event.defaultPrevented) return;
    if (this.formulaireOuvert() && focusDans('.formulaire-ingredient')) {
      this.fermer();
    } else if (this.mouvementIngredientId() !== null) {
      this.fermerMouvement();
    } else {
      this.fermer();
    }
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
    if (this.mouvementIngredientId() === ingredient.id) {
      this.fermerMouvement();
      return;
    }
    if (this.mouvementIngredientId() !== null) {
      if (!this.suiviMouvement.peutFermer(this.etatMouvement())) return;
    }
    this.mouvementIngredientId.set(ingredient.id);
    this.typeMouvement = 'ENTREE';
    this.quantiteMouvement = 0;
    this.erreurFormulaire.set(null);
    this.suiviMouvement.ouvert(this.etatMouvement());
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
