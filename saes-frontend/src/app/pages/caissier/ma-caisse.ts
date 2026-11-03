import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';

import { SessionCaisseDto } from '../../core/models';
import { MontantPipe } from '../../shared/montant.pipe';

/** Rappel de la caisse ouverte, en tete des pages du caissier. */
@Component({
  selector: 'app-ma-caisse',
  imports: [DatePipe, MontantPipe],
  template: `
    <section class="carte">
      <p class="commande-meta">
        Caisse ouverte le {{ session().dateHeureOuverture | date }} — fond de caisse :
        {{ session().fondDeCaisse | montant }}
      </p>
    </section>
  `,
})
export class MaCaisse {
  readonly session = input.required<SessionCaisseDto>();
}
