import { Component, computed, input } from '@angular/core';

import { CategoriePlat } from '../core/models';
import { photoDuPlat } from '../core/photos-plats';
import { IconeCategorie } from './icone-categorie';

/**
 * La photo d'un plat, ou l'icone de sa categorie quand il n'en a pas. Le nom
 * du plat est ecrit a cote : l'image est decorative (alt vide).
 */
@Component({
  selector: 'app-photo-plat',
  imports: [IconeCategorie],
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
      <app-icone-categorie [categorie]="categorie()" />
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

    app-icone-categorie {
      display: block;
      width: 40%;
      height: 100%;
      margin: 0 auto;
      color: var(--saes-vert-attenue);
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
