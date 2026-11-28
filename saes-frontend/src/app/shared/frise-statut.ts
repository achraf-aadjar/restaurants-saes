import { Component, computed, input } from '@angular/core';

import { StatutCommande } from '../core/models';

const ETAPES: { statut: StatutCommande; libelle: string }[] = [
  { statut: 'EN_ATTENTE', libelle: 'Reçue' },
  { statut: 'EN_PREPARATION', libelle: 'En préparation' },
  { statut: 'PRETE', libelle: 'Prête' },
];

/**
 * Ou en est la commande d'un client : reçue, en préparation, prête. Les étapes
 * passées sont cochées, l'étape en cours est marquée. Une commande payée,
 * annulée ou abandonnée n'a pas de frise : son badge suffit.
 */
@Component({
  selector: 'app-frise-statut',
  template: `
    @if (rang() >= 0) {
      <ol class="frise" [attr.aria-label]="'Avancement de la commande : ' + etapes[rang()].libelle">
        @for (e of etapes; track e.statut; let i = $index) {
          <li [class.fait]="i < rang()" [class.courant]="i === rang()">
            <span class="rond" aria-hidden="true">
              @if (i < rang()) {
                <svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
              }
            </span>
            <span class="libelle">{{ e.libelle }}</span>
          </li>
        }
      </ol>
    }
  `,
  styles: `
    .frise {
      display: flex;
      margin: 0.25rem 0 1rem;
      padding: 0;
      list-style: none;
    }

    li {
      position: relative;
      display: flex;
      flex: 1;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      color: var(--saes-vert-attenue);
      font-size: 0.8rem;
      font-weight: 600;
      text-align: center;
    }

    /* Le trait qui relie une etape a la precedente. */
    li:not(:first-child)::before {
      content: '';
      position: absolute;
      top: 0.7rem;
      right: 50%;
      width: 100%;
      height: 3px;
      background: var(--saes-bordure);
    }

    li.fait::before,
    li.courant::before {
      background: var(--saes-marque-vert);
    }

    .rond {
      position: relative;
      z-index: 1;
      display: grid;
      place-items: center;
      width: 1.5rem;
      height: 1.5rem;
      border: 3px solid var(--saes-bordure);
      border-radius: 50%;
      background: var(--saes-surface);
    }

    .fait .rond {
      border-color: var(--saes-marque-vert);
      background: var(--saes-marque-vert);
    }

    .courant .rond {
      border-color: var(--saes-marque-vert);
      animation: saes-pouls 1.6s ease-out infinite;
    }

    .fait,
    .courant {
      color: var(--saes-vert);
    }

    svg {
      width: 0.9rem;
      height: 0.9rem;
      fill: none;
      stroke: var(--saes-texte-sur-action);
      stroke-width: 3.5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    @keyframes saes-pouls {
      0% {
        box-shadow: 0 0 0 0 color-mix(in srgb, var(--saes-action) 45%, transparent);
      }

      100% {
        box-shadow: 0 0 0 0.6rem transparent;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .courant .rond {
        animation: none;
      }
    }
  `,
})
export class FriseStatut {
  readonly statut = input.required<StatutCommande>();

  protected readonly etapes = ETAPES;
  protected readonly rang = computed(() => ETAPES.findIndex((e) => e.statut === this.statut()));
}
