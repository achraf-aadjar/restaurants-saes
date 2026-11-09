import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import { classeBadgeStatut, LIBELLES_STATUT_COMMANDE } from '../core/commande.util';
import { estAujourdhui } from '../core/date.util';
import { CommandeDto } from '../core/models';

/**
 * En-tete d'une commande sur les ecrans du personnel : son numero en grand, son
 * heure d'arrivee et si elle est sur place ou a emporter. En affichage
 * « compact » (liste), le statut est a droite du numero. En affichage « grand »
 * (cuisine, lu de loin), le numero est tres grand, les deux lignes ont une
 * icone, et le statut est laisse a la page.
 */
@Component({
  selector: 'app-commande-entete',
  imports: [DatePipe],
  template: `
    <div class="commande-entete" [class.grand]="grand()">
      <span class="grand-nombre">{{ commande().id }}</span>
      @if (!grand()) {
        <span class="badge" [class]="classeBadge(commande().statut)">
          {{ libelles[commande().statut] }}
        </span>
      }
    </div>
    <p class="commande-meta" [class.avec-icone]="grand()">
      @if (grand()) {
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      }
      @if (arriveeAujourdhui()) {
        Arrivée à {{ commande().dateHeure | date: "H 'h' mm" }}
      } @else {
        Arrivée le {{ commande().dateHeure | date }}
      }
    </p>
    <p class="commande-meta" [class.avec-icone]="grand()">
      @if (grand()) {
        <svg class="icone-pleine" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
          />
          <circle cx="12" cy="10" r="3" />
        </svg>
      }
      {{
        commande().type === 'SUR_PLACE'
          ? 'Sur place, table ' + commande().tableNumero
          : 'À emporter'
      }}
    </p>
  `,
  styles: `
    .commande-entete.grand {
      justify-content: flex-start;
      margin-bottom: 0.6rem;
    }

    .grand .grand-nombre {
      font-size: clamp(2.25rem, 4.2vw, 4rem);
      font-weight: 800;
      line-height: 1;
    }

    .commande-meta.avec-icone {
      display: flex;
      align-items: center;
      gap: 0.6em;
      margin-bottom: 0.45rem;
      font-size: clamp(0.95rem, 1.15vw, 1.1rem);
      color: var(--saes-vert);
    }

    .avec-icone svg {
      flex: none;
      width: 1.35em;
      height: 1.35em;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    /* L'epingle est pleine, son centre est de la couleur de la carte. */
    .avec-icone .icone-pleine {
      fill: currentColor;
      stroke: none;
    }

    .avec-icone .icone-pleine circle {
      fill: #fff;
    }
  `,
})
export class CommandeEntete {
  readonly commande = input.required<CommandeDto>();
  readonly affichage = input<'compact' | 'grand'>('compact');

  protected readonly grand = computed(() => this.affichage() === 'grand');
  protected readonly libelles = LIBELLES_STATUT_COMMANDE;
  protected readonly classeBadge = classeBadgeStatut;
  protected readonly arriveeAujourdhui = computed(() => estAujourdhui(this.commande().dateHeure));
}
