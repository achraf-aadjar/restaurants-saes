import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth.service';
import { motifErreur } from '../../../core/erreur.util';
import { GoogleSignInButton } from '../../../shared/google-sign-in-button';

/**
 * S'authentifier (cahier des charges §4.1), avec en plus la connexion
 * Google.
 */
@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, GoogleSignInButton],
  templateUrl: './login.html',
  styleUrl: '../auth.scss',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected email = '';
  protected motDePasse = '';
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly motDePasseVisible = signal(false);

  protected valider(): void {
    this.erreur.set(null);
    this.enCours.set(true);
    this.auth.authentifier({ email: this.email, motDePasse: this.motDePasse }).subscribe({
      next: () => {
        this.enCours.set(false);
        this.router.navigate(['/menus']);
      },
      error: (err) => {
        this.enCours.set(false);
        this.erreur.set(motifErreur(err, 'Connexion impossible'));
      },
    });
  }

  protected connecterAvecGoogle(idToken: string): void {
    this.erreur.set(null);
    this.enCours.set(true);
    this.auth.authentifierAvecGoogle({ idToken }).subscribe({
      next: () => {
        this.enCours.set(false);
        this.router.navigate(['/menus']);
      },
      error: (err) => {
        this.enCours.set(false);
        this.erreur.set(motifErreur(err, 'Connexion avec Google impossible'));
      },
    });
  }
}
