import { AuthPanneau } from '../auth-panneau';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth.service';
import { motifErreur } from '../../../core/erreur.util';
import { LIBELLES_PROFILS, PROFILS } from '../../../core/libelles';
import { ProfilClient } from '../../../core/models';
import { allerApresConnexion } from '../../../core/navigation';
import { GoogleSignInButton } from '../../../shared/google-sign-in-button';
import { RefusVisible } from '../../../shared/refus-visible';

/**
 * S'inscrire (cahier des charges §4.1), avec en plus l'inscription Google.
 */
@Component({
  selector: 'app-register',
  imports: [AuthPanneau, FormsModule, RouterLink, GoogleSignInButton, RefusVisible],
  templateUrl: './register.html',
  styleUrl: '../auth.scss',
})
export class Register {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected nom = '';
  protected prenom = '';
  protected email = '';
  protected telephone = '';
  protected motDePasse = '';
  /** Etudiant ou professeur : demande a l'inscription, car des abonnements existent. */
  protected readonly profil = signal<ProfilClient | null>(null);
  protected readonly profils = PROFILS;
  protected readonly libellesProfils = LIBELLES_PROFILS;
  protected readonly profilManquant = signal(false);
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly motDePasseVisible = signal(false);

  protected valider(): void {
    this.erreur.set(null);
    if (!this.profil()) {
      this.profilManquant.set(true);
      return;
    }
    this.enCours.set(true);
    this.auth
      .inscrire({
        nom: this.nom,
        prenom: this.prenom,
        email: this.email,
        motDePasse: this.motDePasse,
        telephone: this.telephone || undefined,
        profil: this.profil()!,
      })
      .subscribe({
        next: (reponse) => {
          this.enCours.set(false);
          allerApresConnexion(this.router, reponse.utilisateur);
        },
        error: (err) => {
          this.enCours.set(false);
          this.erreur.set(motifErreur(err, 'Inscription impossible'));
        },
      });
  }

  protected choisirProfil(profil: ProfilClient): void {
    this.profil.set(profil);
    this.profilManquant.set(false);
  }

  protected inscrireAvecGoogle(idToken: string): void {
    this.erreur.set(null);
    if (!this.profil()) {
      this.profilManquant.set(true);
      return;
    }
    this.enCours.set(true);
    this.auth.authentifierAvecGoogle({ idToken, profil: this.profil() ?? undefined }).subscribe({
      next: (reponse) => {
        this.enCours.set(false);
        allerApresConnexion(this.router, reponse.utilisateur);
      },
      error: (err) => {
        this.enCours.set(false);
        this.erreur.set(motifErreur(err, 'Inscription avec Google impossible'));
      },
    });
  }
}
