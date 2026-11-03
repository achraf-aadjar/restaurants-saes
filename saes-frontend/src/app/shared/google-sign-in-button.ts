import { AfterViewInit, Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';

import { GOOGLE_CLIENT_ID } from '../core/google-auth.config';

/**
 * Bouton "Continuer avec Google" (cahier des charges §4.1, en plus de
 * l'email/mot de passe). Affiche le bouton officiel de Google Identity
 * Services et emet le jeton d'identite brut a verifier cote serveur.
 */
@Component({
  selector: 'app-google-sign-in-button',
  template: '<div #conteneur></div>',
})
export class GoogleSignInButton implements AfterViewInit {
  @ViewChild('conteneur', { static: true }) private readonly conteneur!: ElementRef<HTMLDivElement>;
  @Output() readonly jeton = new EventEmitter<string>();

  ngAfterViewInit(): void {
    this.initialiser();
  }

  private initialiser(tentative = 0): void {
    if (!window.google?.accounts?.id) {
      if (tentative < 20) {
        setTimeout(() => this.initialiser(tentative + 1), 150);
      }
      return;
    }
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (reponse) => this.jeton.emit(reponse.credential),
    });
    window.google.accounts.id.renderButton(this.conteneur.nativeElement, {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      width: 320,
    });
  }
}
