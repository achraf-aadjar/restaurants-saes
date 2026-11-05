import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { estAujourdhui } from '../../core/date.util';
import { SessionCaisseDto } from '../../core/models';
import { MontantPipe } from '../../shared/montant.pipe';

/**
 * Rappel de la caisse ouverte, en tete des pages du caissier, comme sur l'ecran
 * de reference 3 : depuis quand elle est ouverte, son fond et de quoi la cloturer.
 */
@Component({
  selector: 'app-ma-caisse',
  imports: [DatePipe, RouterLink, MontantPipe],
  template: `
    <section class="carte ma-caisse">
      <div>
        <h2>Ma caisse</h2>
        <p class="commande-meta">
          @if (ouverteAujourdhui()) {
            Ouverte depuis {{ session().dateHeureOuverture | date: "H 'h' mm" }}
          } @else {
            Ouverte depuis le {{ session().dateHeureOuverture | date }}
          }
        </p>
        <p class="commande-meta">Fond de caisse : {{ session().fondDeCaisse | montant }}</p>
      </div>
      @if (avecCloture()) {
        <a routerLink="/caissier/cloturer" class="btn btn-secondaire">Clôturer la caisse</a>
      }
    </section>
  `,
})
export class MaCaisse {
  readonly session = input.required<SessionCaisseDto>();
  /** Faux sur la page de cloture, qui a deja son formulaire. */
  readonly avecCloture = input(true);

  protected readonly ouverteAujourdhui = computed(() =>
    estAujourdhui(this.session().dateHeureOuverture),
  );
}
