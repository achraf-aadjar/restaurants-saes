import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth.service';
import { motifErreur } from '../../../core/erreur.util';

/**
 * S'inscrire (cahier des charges §4.1).
 */
@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
})
export class Register {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected nom = '';
  protected prenom = '';
  protected email = '';
  protected telephone = '';
  protected motDePasse = '';
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected valider(): void {
    this.erreur.set(null);
    this.enCours.set(true);
    this.auth
      .inscrire({
        nom: this.nom,
        prenom: this.prenom,
        email: this.email,
        motDePasse: this.motDePasse,
        telephone: this.telephone || undefined,
      })
      .subscribe({
        next: () => {
          this.enCours.set(false);
          this.router.navigate(['/menus']);
        },
        error: (err) => {
          this.enCours.set(false);
          this.erreur.set(motifErreur(err, 'Inscription impossible'));
        },
      });
  }
}
