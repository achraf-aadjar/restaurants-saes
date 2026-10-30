import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { motifErreur } from '../../core/erreur.util';

/**
 * Gerer son compte (cahier des charges §4.1) : voir/modifier ses
 * informations ; pour un client, supprimer son compte.
 */
@Component({
  selector: 'app-mon-compte',
  imports: [FormsModule],
  templateUrl: './mon-compte.html',
})
export class MonCompte {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly utilisateurInitial = this.auth.utilisateur();

  protected nom = this.utilisateurInitial?.nom ?? '';
  protected prenom = this.utilisateurInitial?.prenom ?? '';
  protected email = this.utilisateurInitial?.email ?? '';
  protected telephone = this.utilisateurInitial?.telephone ?? '';
  protected nouveauMotDePasse = '';

  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly succes = signal<string | null>(null);
  protected readonly confirmationSuppression = signal(false);

  protected estClientSeul(): boolean {
    return this.auth.utilisateur()?.roles.length === 1 && this.auth.aLeRole('CLIENT');
  }

  protected enregistrer(): void {
    this.erreur.set(null);
    this.succes.set(null);
    this.enCours.set(true);
    this.auth
      .modifierCompte({
        nom: this.nom,
        prenom: this.prenom,
        email: this.email,
        telephone: this.telephone || undefined,
        nouveauMotDePasse: this.nouveauMotDePasse || undefined,
      })
      .subscribe({
        next: () => {
          this.enCours.set(false);
          this.nouveauMotDePasse = '';
          this.succes.set('Vos informations ont été mises à jour.');
        },
        error: (err) => {
          this.enCours.set(false);
          this.erreur.set(motifErreur(err, 'Modification impossible'));
        },
      });
  }

  protected supprimerCompte(): void {
    this.enCours.set(true);
    this.auth.supprimerCompte().subscribe({
      next: () => {
        this.router.navigate(['/menus']);
      },
      error: (err) => {
        this.enCours.set(false);
        this.erreur.set(motifErreur(err, 'Suppression impossible'));
      },
    });
  }
}
