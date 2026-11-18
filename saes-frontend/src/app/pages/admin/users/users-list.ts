import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminRestaurantService } from '../../../core/admin-restaurant.service';
import { AdminUserService } from '../../../core/admin-user.service';
import { motifErreur } from '../../../core/erreur.util';
import { LIBELLES_ROLES } from '../../../core/libelles';
import {
  ROLES_PERSONNEL,
  RestaurantDto,
  Role,
  TOUS_LES_ROLES,
  Utilisateur,
} from '../../../core/models';
import { RefusVisible } from '../../../shared/refus-visible';
import { SuiviFormulaire, amenerALEcran, focusDans } from '../../../shared/suivi-formulaire';

/**
 * Gerer les comptes utilisateurs (cahier des charges §4.7), reserve a
 * l'administrateur : creer un compte personnel, attribuer/retirer des
 * roles, desactiver/reactiver un compte.
 */
@Component({
  selector: 'app-users-list',
  imports: [FormsModule, RefusVisible],
  templateUrl: './users-list.html',
  host: { '(document:keydown.escape)': 'echap($event)' },
})
export class UsersList {
  private readonly adminUserService = inject(AdminUserService);
  private readonly adminRestaurantService = inject(AdminRestaurantService);

  protected readonly rolesPersonnel = ROLES_PERSONNEL;
  protected readonly tousLesRoles = TOUS_LES_ROLES;
  protected readonly libellesRoles = LIBELLES_ROLES;
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

  private readonly suiviRoles = new SuiviFormulaire();
  private readonly suiviCreation = new SuiviFormulaire();

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

  /**
   * « + Nouveau compte du personnel » ouvre ou referme le formulaire. Le
   * refermer garde ce qui a été saisi (comme « Annuler ») : rien n'est perdu.
   */
  protected basculerCreation(): void {
    if (this.formulaireOuvert()) {
      this.fermerCreation();
      return;
    }
    this.formulaireOuvert.set(true);
    this.suiviCreation.ouvert(null);
  }

  protected fermerCreation(): void {
    this.formulaireOuvert.set(false);
    this.suiviCreation.rendreFocus();
  }

  protected ouvrirEditionRoles(utilisateur: Utilisateur): void {
    const ouvert = this.enEdition();
    if (ouvert?.id === utilisateur.id) {
      this.fermerRoles();
      return;
    }
    if (ouvert && !this.suiviRoles.peutFermer(this.etatRoles())) return;
    this.enEdition.set(utilisateur);
    this.rolesEdition = new Set(utilisateur.roles);
    this.restaurantEdition = null;
    this.erreurEdition.set(null);
    this.suiviRoles.ouvert(this.etatRoles());
    amenerALEcran('.formulaire-roles');
  }

  /** Rôles cochés : pour savoir s'ils ont été modifiés avant de fermer. */
  private etatRoles(): unknown {
    return [this.enEdition()?.id, [...this.rolesEdition].sort(), this.restaurantEdition];
  }

  /** « Annuler » : on renonce, sans question. */
  protected annulerRoles(): void {
    this.enEdition.set(null);
    this.suiviRoles.rendreFocus();
  }

  /** Échap ou second clic sur « Rôles » : confirmation si des rôles ont été changés. */
  private fermerRoles(): void {
    if (!this.enEdition() || !this.suiviRoles.peutFermer(this.etatRoles())) return;
    this.annulerRoles();
  }

  /**
   * Échap ferme le formulaire où l'on se trouve ; ailleurs dans la page, les
   * rôles d'abord, puis la création.
   */
  protected echap(event: Event): void {
    if (event.defaultPrevented) return;
    if (this.formulaireOuvert() && focusDans('.formulaire-compte')) {
      this.fermerCreation();
    } else if (this.enEdition()) {
      this.fermerRoles();
    } else if (this.formulaireOuvert()) {
      this.fermerCreation();
    }
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
