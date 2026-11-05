import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import { classeBadgeStatut, LIBELLES_STATUT_COMMANDE } from '../core/commande.util';
import { estAujourdhui } from '../core/date.util';
import { CommandeDto } from '../core/models';

/**
 * En-tete d'une commande sur les ecrans du personnel, comme sur l'ecran de
 * reference 2 : son numero en grand, son statut, son heure d'arrivee et si elle
 * est sur place ou a emporter.
 */
@Component({
  selector: 'app-commande-entete',
  imports: [DatePipe],
  template: `
    <div class="commande-entete">
      <span class="grand-nombre">{{ commande().id }}</span>
      <span class="badge" [class]="classeBadge(commande().statut)">
        {{ libelles[commande().statut] }}
      </span>
    </div>
    <p class="commande-meta">
      @if (arriveeAujourdhui()) {
        Arrivée à {{ commande().dateHeure | date: "H 'h' mm" }}
      } @else {
        Arrivée le {{ commande().dateHeure | date }}
      }
    </p>
    <p class="commande-meta">
      {{
        commande().type === 'SUR_PLACE'
          ? 'Sur place, table ' + commande().tableNumero
          : 'À emporter'
      }}
    </p>
  `,
})
export class CommandeEntete {
  readonly commande = input.required<CommandeDto>();

  protected readonly libelles = LIBELLES_STATUT_COMMANDE;
  protected readonly classeBadge = classeBadgeStatut;
  protected readonly arriveeAujourdhui = computed(() => estAujourdhui(this.commande().dateHeure));
}
