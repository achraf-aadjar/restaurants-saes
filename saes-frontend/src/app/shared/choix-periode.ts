import { DatePipe } from '@angular/common';
import { Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { RefusVisible } from './refus-visible';

export interface Periode {
  debut: string;
  fin: string;
}

/**
 * Période d'un rapport : affichée en texte (« Du 10/10/2026 au 09/11/2026 »),
 * avec « Changer la période » qui ouvre les deux dates. Une période incomplète ou
 * inversée est refusée avec un message, sans interroger le serveur. Échap referme
 * le panneau et rend le focus au bouton. À placer dans un `.titre-page`, à côté du titre.
 */
@Component({
  selector: 'app-choix-periode',
  imports: [DatePipe, FormsModule, RefusVisible],
  templateUrl: './choix-periode.html',
  styleUrl: './choix-periode.scss',
})
export class ChoixPeriode {
  /** Période affichée (dates au format AAAA-MM-JJ). */
  readonly debut = input.required<string>();
  readonly fin = input.required<string>();
  /** Un chargement est en cours : « Afficher » est désactivé. */
  readonly occupe = input(false);
  /** Émis quand une période valide est choisie. */
  readonly choisie = output<Periode>();

  protected readonly ouvert = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected debutSaisi = '';
  protected finSaisie = '';

  private readonly bouton = viewChild<ElementRef<HTMLButtonElement>>('bouton');

  protected basculer(): void {
    if (this.ouvert()) {
      this.fermer();
      return;
    }
    this.debutSaisi = this.debut();
    this.finSaisie = this.fin();
    this.erreur.set(null);
    this.ouvert.set(true);
    // Le panneau apparait apres ce cycle : le curseur va sur la premiere date.
    setTimeout(() => document.getElementById('periode-debut')?.focus());
  }

  protected fermer(): void {
    this.ouvert.set(false);
    this.erreur.set(null);
    this.bouton()?.nativeElement.focus();
  }

  protected valider(): void {
    if (!this.debutSaisi || !this.finSaisie) {
      this.erreur.set('Choisissez la date de début et la date de fin.');
      return;
    }
    if (this.debutSaisi > this.finSaisie) {
      this.erreur.set('La date de fin ne peut pas être avant la date de début');
      return;
    }
    this.erreur.set(null);
    this.ouvert.set(false);
    this.choisie.emit({ debut: this.debutSaisi, fin: this.finSaisie });
  }
}
