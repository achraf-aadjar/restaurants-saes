import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';

import { GOOGLE_CLIENT_ID } from '../core/google-auth.config';

const LARGEUR_MIN = 200;
const LARGEUR_MAX = 400;

/**
 * Bouton officiel "Continuer avec Google" (Google Identity Services). Il
 * prend la largeur de son conteneur (dans les limites imposees par Google)
 * et se redessine quand l'ecran change de taille.
 */
@Component({
  selector: 'app-google-sign-in-button',
  template: '<div #conteneur class="conteneur"></div>',
  styles: `
    :host {
      display: block;
      width: 100%;
      min-width: 0;
      overflow: hidden;
    }
    .conteneur {
      display: flex;
      justify-content: center;
      min-height: 40px;
    }
  `,
})
export class GoogleSignInButton implements AfterViewInit, OnDestroy {
  @ViewChild('conteneur', { static: true }) private readonly conteneur!: ElementRef<HTMLDivElement>;
  @Input() texte: 'signin_with' | 'signup_with' | 'continue_with' = 'continue_with';
  @Output() readonly jeton = new EventEmitter<string>();

  private observateur?: ResizeObserver;
  private largeurAffichee = 0;
  private minuterie?: ReturnType<typeof setTimeout>;

  constructor(private readonly hote: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    this.initialiser();
  }

  ngOnDestroy(): void {
    this.observateur?.disconnect();
    clearTimeout(this.minuterie);
  }

  private initialiser(tentative = 0): void {
    const google = window.google;
    if (!google?.accounts?.id) {
      if (tentative < 40) {
        this.minuterie = setTimeout(() => this.initialiser(tentative + 1), 150);
      }
      return;
    }
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (reponse) => this.jeton.emit(reponse.credential),
    });
    this.dessiner();
    this.observateur = new ResizeObserver(() => {
      clearTimeout(this.minuterie);
      this.minuterie = setTimeout(() => this.dessiner(), 120);
    });
    this.observateur.observe(this.hote.nativeElement);
  }

  private dessiner(): void {
    const disponible = this.hote.nativeElement.clientWidth;
    const largeur = Math.round(Math.min(LARGEUR_MAX, Math.max(LARGEUR_MIN, disponible)));
    if (largeur === this.largeurAffichee || !window.google) {
      return;
    }
    this.largeurAffichee = largeur;
    window.google.accounts.id.renderButton(this.conteneur.nativeElement, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      text: this.texte,
      logo_alignment: 'center',
      locale: 'fr',
      width: largeur,
    });
  }
}
