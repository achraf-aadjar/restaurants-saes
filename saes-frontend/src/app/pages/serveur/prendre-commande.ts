import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { CommandeServeurService } from '../../core/commande-serveur.service';
import { motifErreur } from '../../core/erreur.util';
import { MenuService } from '../../core/menu.service';
import { PlatResume, TableOccupationDto, TypeCommande } from '../../core/models';

interface LigneSaisie {
  plat: PlatResume;
  quantite: number;
}

/** Prendre une commande (cahier des charges §4.3), cote serveur. */
@Component({
  selector: 'app-prendre-commande',
  imports: [FormsModule],
  templateUrl: './prendre-commande.html',
})
export class PrendreCommande {
  private readonly menuService = inject(MenuService);
  private readonly commandeServeurService = inject(CommandeServeurService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly plats = signal<PlatResume[]>([]);
  protected readonly tables = signal<TableOccupationDto[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly envoiEnCours = signal(false);

  protected type: TypeCommande = 'SUR_PLACE';
  protected tableId: number | null = null;
  protected readonly lignes = signal<Map<number, LigneSaisie>>(new Map());

  protected readonly lignesListe = computed(() => Array.from(this.lignes().values()));
  protected readonly total = computed(() =>
    this.lignesListe().reduce((t, l) => t + l.plat.prix * l.quantite, 0),
  );

  constructor() {
    const restaurantId = this.auth.utilisateur()?.restaurantId;
    if (!restaurantId) {
      this.erreur.set('Votre compte n\'est rattaché à aucun restaurant');
      this.chargement.set(false);
      return;
    }
    this.menuService.menusEnVigueur(restaurantId).subscribe({
      next: (menus) => {
        const parId = new Map<number, PlatResume>();
        for (const menu of menus) {
          for (const plat of menu.plats) {
            parId.set(plat.id, plat);
          }
        }
        this.plats.set(Array.from(parId.values()));
        this.chargement.set(false);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de charger les plats'));
      },
    });
    this.commandeServeurService.occupationTables().subscribe((occ) => this.tables.set(occ.tables));
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
      this.erreur.set('Ajoutez au moins un plat');
      return;
    }
    if (this.type === 'SUR_PLACE' && !this.tableId) {
      this.erreur.set('Choisissez une table pour une commande sur place');
      return;
    }
    this.envoiEnCours.set(true);
    this.commandeServeurService
      .prendreCommande({
        type: this.type,
        tableId: this.type === 'SUR_PLACE' ? this.tableId : null,
        lignes: this.lignesListe().map((l) => ({ platId: l.plat.id, quantite: l.quantite })),
      })
      .subscribe({
        next: () => {
          this.envoiEnCours.set(false);
          this.router.navigate(['/serveur/occupation']);
        },
        error: (err) => {
          this.envoiEnCours.set(false);
          this.erreur.set(motifErreur(err, 'La commande n\'a pas pu être enregistrée'));
        },
      });
  }
}
