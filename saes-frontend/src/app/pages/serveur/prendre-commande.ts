import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';

import { AuthService } from '../../core/auth.service';
import { CommandeServeurService } from '../../core/commande-serveur.service';
import { motifErreur } from '../../core/erreur.util';
import { MenuService } from '../../core/menu.service';
import { LIBELLES_CATEGORIES_PLURIEL, ORDRE_CATEGORIES } from '../../core/libelles';
import { CommandeDto, PlatResume, TableOccupationDto, TypeCommande } from '../../core/models';
import { MontantPipe } from '../../shared/montant.pipe';
import { RefusVisible } from '../../shared/refus-visible';

interface LigneSaisie {
  plat: PlatResume;
  quantite: number;
}

/**
 * Prendre une commande (cahier des charges §4.3), cote serveur. Le meme ecran modifie une
 * commande en attente (/serveur/commandes/:id/modifier) : seuls les plats et les quantites
 * changent, le type et la table restent ceux de la commande.
 */
@Component({
  selector: 'app-prendre-commande',
  imports: [FormsModule, MontantPipe, RefusVisible, RouterLink],
  templateUrl: './prendre-commande.html',
  styleUrl: './prendre-commande.scss',
})
export class PrendreCommande {
  private readonly menuService = inject(MenuService);
  private readonly commandeServeurService = inject(CommandeServeurService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Numero de la commande modifiee ; null quand on prend une nouvelle commande. */
  protected readonly idModifiee = Number(inject(ActivatedRoute).snapshot.paramMap.get('id')) || null;
  /** La commande modifiee, telle qu'elle a ete chargee (sa version part avec la modification). */
  private commandeModifiee: CommandeDto | null = null;
  /** Faux tant que la commande a modifier n'est pas retrouvee parmi celles en attente. */
  protected readonly commandeTrouvee = signal(false);

  protected readonly plats = signal<PlatResume[]>([]);
  protected readonly tables = signal<TableOccupationDto[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly envoiEnCours = signal(false);

  protected readonly libellesCategoriesPluriel = LIBELLES_CATEGORIES_PLURIEL;

  protected type: TypeCommande = 'SUR_PLACE';
  protected tableId: number | null = null;
  protected readonly lignes = signal<Map<number, LigneSaisie>>(new Map());

  /**
   * Les plats regroupés par catégorie, dans l'ordre du repas, puis dans l'ordre de leur
   * création, comme pour le client et le gérant : l'ordre ne change pas d'un chargement à
   * l'autre, le serveur retrouve ses plats à la même place.
   */
  protected readonly groupes = computed(() =>
    ORDRE_CATEGORIES.map((categorie) => ({
      categorie,
      plats: this.plats()
        .filter((p) => p.categorie === categorie)
        .sort((x, y) => x.id - y.id),
    })).filter((g) => g.plats.length > 0),
  );

  protected readonly lignesListe = computed(() => Array.from(this.lignes().values()));
  protected readonly total = computed(() =>
    this.lignesListe().reduce((t, l) => t + l.plat.prix * l.quantite, 0),
  );

  constructor() {
    const restaurantId = this.auth.utilisateur()?.restaurantId;
    if (!restaurantId) {
      this.erreur.set("Votre compte n'est rattaché à aucun restaurant");
      this.chargement.set(false);
      return;
    }
    forkJoin({
      menus: this.menuService.menusEnVigueur(restaurantId),
      commandes: this.idModifiee ? this.commandeServeurService.commandesEnAttente() : of([]),
    }).subscribe({
      next: ({ menus, commandes }) => {
        const parId = new Map<number, PlatResume>();
        for (const menu of menus) {
          for (const plat of menu.plats) {
            parId.set(plat.id, plat);
          }
        }
        this.plats.set(Array.from(parId.values()));
        if (this.idModifiee) {
          this.preremplir(commandes.find((c) => c.id === this.idModifiee), parId);
        }
        this.chargement.set(false);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de charger les plats'));
      },
    });
    this.commandeServeurService.occupationTables().subscribe((occ) => this.tables.set(occ.tables));
  }

  /**
   * Reprend le type, la table et les plats de la commande a modifier. Un plat qui n'est
   * plus dans les menus en vigueur reste dans le recapitulatif, a son prix de la commande.
   */
  private preremplir(commande: CommandeDto | undefined, plats: Map<number, PlatResume>): void {
    if (!commande) {
      this.erreur.set(`La commande ${this.idModifiee} n'est plus en attente : elle ne peut plus être modifiée`);
      return;
    }
    this.commandeModifiee = commande;
    this.commandeTrouvee.set(true);
    this.type = commande.type;
    this.tableId = commande.tableId;
    const lignes = new Map<number, LigneSaisie>();
    for (const l of commande.lignes) {
      const plat = plats.get(l.platId) ?? {
        id: l.platId,
        nom: l.platNom,
        description: null,
        prix: l.prixUnitaire,
        categorie: 'PLAT_PRINCIPAL' as const,
      };
      lignes.set(l.platId, { plat, quantite: l.quantite });
    }
    this.lignes.set(lignes);
  }

  protected quantiteDe(plat: PlatResume): number {
    return this.lignes().get(plat.id)?.quantite ?? 0;
  }

  protected ajouter(plat: PlatResume): void {
    const copie = new Map(this.lignes());
    const existant = copie.get(plat.id);
    copie.set(plat.id, { plat, quantite: (existant?.quantite ?? 0) + 1 });
    this.lignes.set(copie);
  }

  protected retirer(plat: PlatResume): void {
    const copie = new Map(this.lignes());
    const existant = copie.get(plat.id);
    if (!existant) return;
    if (existant.quantite <= 1) {
      copie.delete(plat.id);
    } else {
      copie.set(plat.id, { plat, quantite: existant.quantite - 1 });
    }
    this.lignes.set(copie);
  }

  protected enregistrer(): void {
    this.erreur.set(null);
    if (this.lignesListe().length === 0) {
      this.refuser('Ajoutez au moins un plat');
      return;
    }
    if (this.type === 'SUR_PLACE' && !this.tableId) {
      this.refuser('Choisissez une table pour une commande sur place');
      return;
    }
    this.envoiEnCours.set(true);
    const lignes = this.lignesListe().map((l) => ({ platId: l.plat.id, quantite: l.quantite }));
    const envoi = this.commandeModifiee
      ? this.commandeServeurService.modifierCommande(this.commandeModifiee.id, {
          lignes,
          version: this.commandeModifiee.version,
        })
      : this.commandeServeurService.prendreCommande({
          type: this.type,
          tableId: this.type === 'SUR_PLACE' ? this.tableId : null,
          lignes,
        });
    envoi.subscribe({
      next: () => {
        this.envoiEnCours.set(false);
        this.router.navigate(['/serveur/commandes']);
      },
      error: (err) => {
        this.envoiEnCours.set(false);
        this.refuser(
          motifErreur(
            err,
            this.commandeModifiee
              ? "La modification n'a pas pu être enregistrée"
              : "La commande n'a pas pu être enregistrée",
          ),
        );
      },
    });
  }

  /**
   * Refus en haut de l'ecran (Design) ; la commande reste visible quand on descend dans
   * les plats, on remonte donc pour que le refus soit vu.
   */
  private refuser(motif: string): void {
    this.erreur.set(motif);
    window.scrollTo(0, 0);
  }
}
