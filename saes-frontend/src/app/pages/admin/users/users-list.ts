import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminRestaurantService } from '../../../core/admin-restaurant.service';
import { AdminUserService } from '../../../core/admin-user.service';
import { motifErreur } from '../../../core/erreur.util';
import { ROLES, RestaurantDto, Role, Utilisateur } from '../../../core/models';

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

  protected readonly roles = ROLES;
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

  protected basculerRole(role: Role): void {
    if (this.rolesSelectionnes.has(role)) {
      this.rolesSelectionnes.delete(role);
    } else {
      this.rolesSelectionnes.add(role);
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
