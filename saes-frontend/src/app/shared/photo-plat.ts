import { Component, computed, input } from '@angular/core';

import { CategoriePlat } from '../core/models';
import { photoDuPlat } from '../core/photos-plats';

/**
 * La photo d'un plat, ou l'icone de sa categorie quand il n'en a pas. Le nom
 * du plat est ecrit a cote : l'image est decorative (alt vide).
 */
@Component({
  selector: 'app-photo-plat',
  template: `
    @if (photo(); as p) {
      <img
        [src]="p.src"
        [srcset]="p.srcset"
        [sizes]="taille()"
        width="360"
        height="400"
        alt=""
        loading="lazy"
      />
    } @else {
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
    }
  `,
  styles: `
    :host {
      display: block;
      aspect-ratio: 9 / 10;
      border-radius: var(--saes-rayon);
      overflow: hidden;
      background: var(--saes-creme);
      border: 1px solid var(--saes-bordure);
    }

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    svg {
      display: block;
      width: 40%;
      height: 100%;
      margin: 0 auto;
      fill: none;
      stroke: var(--saes-vert-attenue);
      stroke-width: 1.5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `,
})
export class PhotoPlat {
  readonly nom = input.required<string>();
  readonly categorie = input.required<CategoriePlat>();
  /** Largeur affichee, pour que le navigateur choisisse le fichier de 360 ou de 720 px. */
  readonly taille = input('160px');

  protected readonly photo = computed(() => photoDuPlat(this.nom()));
}
