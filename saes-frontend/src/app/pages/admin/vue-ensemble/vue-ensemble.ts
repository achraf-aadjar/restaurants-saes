import { DatePipe, DecimalPipe, LowerCasePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LIBELLES_STATUT_COMMANDE } from '../../../core/commande.util';
import { motifErreur } from '../../../core/erreur.util';
import { LIBELLES_ACTIONS } from '../../../core/journal.service';
import { Role, StatutCommande } from '../../../core/models';
import { LIBELLES_ROLES, SupervisionService, TableauDeBord, ilYA } from '../../../core/supervision.service';
import { GraphiqueBarres, PointGraphique, SerieGraphique } from '../../../shared/graphique-barres';

export const SERIES_ENCAISSEMENTS: SerieGraphique[] = [
  { nom: 'Espèces', couleur: '#00856f' },
  { nom: 'Mobile Money', couleur: '#e0a800' },
];

export function pointsParJour(parJour: { jour: string; montantEspeces: number; montantMobileMoney: number }[]): PointGraphique[] {
  return parJour.map((j) => {
    const date = new Date(j.jour + 'T00:00:00');
    return {
      libelle: date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
      libelleCourt: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      valeurs: [j.montantEspeces, j.montantMobileMoney],
    };
  });
}

/** Vue d'ensemble de l'espace d'administration : tous les restaurants. */
@Component({
  selector: 'app-vue-ensemble',
  imports: [DatePipe, DecimalPipe, LowerCasePipe, RouterLink, GraphiqueBarres],
  templateUrl: './vue-ensemble.html',
})
export class VueEnsemble {
  private readonly supervision = inject(SupervisionService);

  protected readonly periodes = [
    { jours: 7, libelle: '7 jours' },
    { jours: 30, libelle: '30 jours' },
    { jours: 90, libelle: '90 jours' },
  ];
  protected readonly series = SERIES_ENCAISSEMENTS;
  protected readonly libellesActions = LIBELLES_ACTIONS;
  protected readonly libellesStatuts = LIBELLES_STATUT_COMMANDE;
  protected readonly libellesRoles = LIBELLES_ROLES;
  protected readonly statutsEnCours: StatutCommande[] = ['EN_ATTENTE', 'EN_PREPARATION', 'PRETE'];
  protected readonly roles: Role[] = ['CLIENT', 'SERVEUR', 'CUISINIER', 'CAISSIER', 'GERANT', 'ADMINISTRATEUR'];

  protected readonly jours = signal(30);
  protected readonly donnees = signal<TableauDeBord | null>(null);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);

  protected readonly points = computed(() => pointsParJour(this.donnees()?.finances.parJour ?? []));
  protected readonly maxRestaurant = computed(() =>
    Math.max(1, ...(this.donnees()?.finances.parRestaurant ?? []).map((r) => r.chiffreAffaires)),
  );
  protected readonly maxRole = computed(() =>
    Math.max(1, ...Object.values(this.donnees()?.indicateurs.comptesParRole ?? {})),
  );
  protected readonly totalEnCours = computed(() =>
    Object.values(this.donnees()?.indicateurs.commandesEnCours ?? {}).reduce((a, b) => a + (b ?? 0), 0),
  );

  constructor() {
    this.charger();
  }

  protected choisir(jours: number): void {
    this.jours.set(jours);
    this.charger();
  }

  private charger(): void {
    this.chargement.set(true);
    this.erreur.set(null);
    this.supervision.tableauDeBord(ilYA(this.jours() - 1), ilYA(0)).subscribe({
      next: (d) => {
        this.donnees.set(d);
        this.chargement.set(false);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de charger le tableau de bord'));
      },
    });
  }
}
