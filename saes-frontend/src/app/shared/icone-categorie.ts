import { Component, input } from '@angular/core';

import { CategoriePlat } from '../core/models';

/**
 * Icone d'une categorie de plats : devant le titre de la categorie sur l'ecran
 * des menus (ecran de reference 1), et a la place d'une photo manquante.
 * Decorative : le nom de la categorie ou du plat est ecrit a cote.
 */
@Component({
  selector: 'app-icone-categorie',
  template: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      @switch (categorie()) {
        @case ('ENTREE') {
          <path d="M3 11h18a9 9 0 0 1-18 0Z" />
          <path d="M9 8c0-2 1.5-3.5 3-4.5M14.5 8.5c0-1.5 1-2.8 2.5-3.5" />
        }
        @case ('PLAT_PRINCIPAL') {
          <path d="M5 3v5a2 2 0 0 0 4 0V3M7 3v18" />
          <path d="M18 3c-2 1.5-3 4.5-3 9h3v9" />
        }
        @case ('DESSERT') {
          <path d="M5 12h14l-2 8H7Z" />
          <path d="M6 12a6 5 0 0 1 12 0" />
          <circle cx="12" cy="5" r="1.2" />
        }
        @case ('BOISSON') {
          <path d="M6 8h12l-1.5 13h-9Z" />
          <path d="M13 8l2-5h3" />
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-block;
      line-height: 0;
    }

    svg {
      width: 100%;
      height: 100%;
      fill: none;
      stroke: currentColor;
      stroke-width: var(--epaisseur, 1.5);
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `,
})
export class IconeCategorie {
  readonly categorie = input.required<CategoriePlat>();
}
