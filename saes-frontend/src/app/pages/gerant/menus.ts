import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { motifErreur } from '../../core/erreur.util';
import { GerantMenuService } from '../../core/gerant-menu.service';
import { GerantPlatService } from '../../core/gerant-plat.service';
import { MenuGerantDto, MenuSaveRequest, PlatGerantDto } from '../../core/models';

/** Gerer les menus (cahier des charges §4.2), reserve au gerant. */
@Component({
  selector: 'app-gerant-menus',
  imports: [FormsModule],
  templateUrl: './menus.html',
})
export class GerantMenus {
  private readonly gerantMenuService = inject(GerantMenuService);
  private readonly gerantPlatService = inject(GerantPlatService);

  protected readonly menus = signal<MenuGerantDto[]>([]);
  protected readonly plats = signal<PlatGerantDto[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly erreurFormulaire = signal<string | null>(null);
  protected readonly enregistrementEnCours = signal(false);
  protected readonly formulaireOuvert = signal(false);

  protected idEnEdition: number | null = null;
  protected nom = '';
  protected dateDebut = '';
  protected dateFin = '';
  protected platIdsSelectionnes = new Set<number>();

  constructor() {
    this.charger();
  }

  private charger(): void {
    this.chargement.set(true);
    this.gerantMenuService.lister().subscribe({
      next: (menus) => {
        this.menus.set(menus);
        this.chargement.set(false);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de charger les menus'));
      },
    });
    this.gerantPlatService.lister().subscribe({ next: (plats) => this.plats.set(plats) });
  }

  protected ouvrirCreation(): void {
    this.idEnEdition = null;
    this.nom = '';
    this.dateDebut = new Date().toISOString().slice(0, 10);
    this.dateFin = '';
    this.platIdsSelectionnes = new Set();
    this.erreurFormulaire.set(null);
    this.formulaireOuvert.set(true);
  }

  protected ouvrirEdition(menu: MenuGerantDto): void {
    this.idEnEdition = menu.id;
    this.nom = menu.nom;
    this.dateDebut = menu.dateDebut;
    this.dateFin = menu.dateFin ?? '';
    this.platIdsSelectionnes = new Set(menu.plats.map((p) => p.id));
    this.erreurFormulaire.set(null);
    this.formulaireOuvert.set(true);
  }

  protected basculerPlat(platId: number): void {
    const copie = new Set(this.platIdsSelectionnes);
    if (copie.has(platId)) {
      copie.delete(platId);
    } else {
      copie.add(platId);
    }
    this.platIdsSelectionnes = copie;
  }

  protected enregistrer(): void {
    this.erreurFormulaire.set(null);
    if (this.platIdsSelectionnes.size === 0) {
      this.erreurFormulaire.set('Le menu doit contenir au moins un plat');
      return;
    }

    const request: MenuSaveRequest = {
      nom: this.nom,
      dateDebut: this.dateDebut,
      dateFin: this.dateFin || undefined,
      platIds: Array.from(this.platIdsSelectionnes),
    };

    this.enregistrementEnCours.set(true);
    const appel = this.idEnEdition
      ? this.gerantMenuService.modifier(this.idEnEdition, request)
      : this.gerantMenuService.creer(request);

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
}
