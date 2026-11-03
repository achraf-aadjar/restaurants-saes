import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminRestaurantService } from '../../../core/admin-restaurant.service';
import { AdminUserService } from '../../../core/admin-user.service';
import { motifErreur } from '../../../core/erreur.util';
import {
  ROLES_PERSONNEL,
  RestaurantDto,
  Role,
  TOUS_LES_ROLES,
  Utilisateur,
} from '../../../core/models';

/**
 * Gerer les comptes utilisateurs (cahier des charges §4.7), reserve a
 * l'administrateur : creer un compte personnel, attribuer/retirer des
 * roles, desactiver/reactiver un compte.
 */
@Component({
  selector: 'app-users-list',
  imports: [FormsModule],
  templateUrl: './users-list.html',
})
export class UsersList {
  private readonly adminUserService = inject(AdminUserService);
  private readonly adminRestaurantService = inject(AdminRestaurantService);

  protected readonly rolesPersonnel = ROLES_PERSONNEL;
  protected readonly tousLesRoles = TOUS_LES_ROLES;
  protected readonly utilisateurs = signal<Utilisateur[]>([]);
  protected readonly restaurants = signal<RestaurantDto[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly erreurFormulaire = signal<string | null>(null);
  protected readonly creationEnCours = signal(false);
  protected readonly formulaireOuvert = signal(false);

  protected nom = '';
  protected prenom = '';
  protected email = '';
  protected motDePasse = '';
  protected telephone = '';
  protected restaurantId: number | null = null;
  protected rolesSelectionnes = new Set<Role>();

  /** Attribuer ou retirer des roles : le compte en cours de modification. */
  protected readonly enEdition = signal<Utilisateur | null>(null);
  protected readonly erreurEdition = signal<string | null>(null);
  protected rolesEdition = new Set<Role>();
  protected restaurantEdition: number | null = null;

  constructor() {
    this.charger();
    this.adminRestaurantService.lister().subscribe((r) => this.restaurants.set(r));
  }

  private charger(): void {
    this.chargement.set(true);
    this.adminUserService.lister().subscribe({
      next: (utilisateurs) => {
        this.utilisateurs.set(utilisateurs);
        this.chargement.set(false);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de charger les utilisateurs'));
      },
    });
  }

  protected basculerRole(roles: Set<Role>, role: Role): void {
    if (roles.has(role)) {
      roles.delete(role);
    } else {
      roles.add(role);
    }
  }

  protected creerPersonnel(): void {
    this.erreurFormulaire.set(null);
    if (!this.restaurantId || this.rolesSelectionnes.size === 0) {
      this.erreurFormulaire.set('Choisissez un restaurant et au moins un rôle');
      return;
    }
    this.creationEnCours.set(true);
    this.adminUserService
      .creerPersonnel({
        nom: this.nom,
        prenom: this.prenom,
        email: this.email,
        motDePasse: this.motDePasse,
        telephone: this.telephone || undefined,
        restaurantId: this.restaurantId,
        roles: Array.from(this.rolesSelectionnes),
      })
      .subscribe({
        next: () => {
          this.creationEnCours.set(false);
          this.reinitialiserFormulaire();
          this.charger();
        },
        error: (err) => {
          this.creationEnCours.set(false);
          this.erreurFormulaire.set(motifErreur(err, 'Création impossible'));
        },
      });
  }

  private reinitialiserFormulaire(): void {
    this.nom = '';
    this.prenom = '';
    this.email = '';
    this.motDePasse = '';
    this.telephone = '';
    this.restaurantId = null;
    this.rolesSelectionnes = new Set<Role>();
    this.formulaireOuvert.set(false);
  }

  protected ouvrirEditionRoles(utilisateur: Utilisateur): void {
    this.enEdition.set(utilisateur);
    this.rolesEdition = new Set(utilisateur.roles);
    this.restaurantEdition = null;
    this.erreurEdition.set(null);
  }

  /**
   * Contrainte 2 de la conception : un compte qui devient membre du personnel
   * alors qu'il n'a pas de restaurant doit en recevoir un.
   */
  protected demandeRestaurant(): boolean {
    const utilisateur = this.enEdition();
    return (
      utilisateur !== null &&
      utilisateur.restaurantId === null &&
      ROLES_PERSONNEL.some((role) => this.rolesEdition.has(role))
    );
  }

  protected enregistrerRoles(): void {
    const utilisateur = this.enEdition();
    if (!utilisateur) {
      return;
    }
    this.erreurEdition.set(null);
    this.adminUserService
      .modifierRoles(
        utilisateur.id,
        Array.from(this.rolesEdition),
        this.demandeRestaurant() ? this.restaurantEdition : null,
      )
      .subscribe({
        next: () => {
          this.enEdition.set(null);
          this.charger();
        },
        error: (err) => this.erreurEdition.set(motifErreur(err, 'Modification impossible')),
      });
  }

  protected changerActivation(utilisateur: Utilisateur): void {
    const action = utilisateur.estActif
      ? this.adminUserService.desactiver(utilisateur.id)
      : this.adminUserService.activer(utilisateur.id);
    action.subscribe({
      next: () => this.charger(),
      error: (err) => this.erreur.set(motifErreur(err, 'Action impossible')),
    });
  }
}
