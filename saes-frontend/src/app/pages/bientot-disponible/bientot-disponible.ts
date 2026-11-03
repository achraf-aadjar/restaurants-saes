import { Component, Input } from '@angular/core';

/**
 * Fonctions du Lot 1 (reservations et commandes) non encore developpees :
 * voir le tableau GitHub Projects du sujet 17.
 */
@Component({
  selector: 'app-bientot-disponible',
  template: `
    <section class="carte">
      <h1>{{ titre }}</h1>
      <p>Cette fonction fait partie du lot 1 et n'est pas encore développée.</p>
    </section>
  `,
})
export class BientotDisponible {
  @Input() titre = 'Bientôt disponible';
}
