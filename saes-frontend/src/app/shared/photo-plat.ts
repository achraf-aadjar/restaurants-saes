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
        [attr.loading]="prioritaire() ? 'eager' : 'lazy'"
      />
    } @else {
      <!-- Pas encore de photo : un fond travaille et la pastille de la categorie,
           pour que la carte ait l'air voulue et non vide. -->
      <span class="vide" aria-hidden="true">
        <span class="pastille"><app-icone-categorie [categorie]="categorie()" /></span>
      </span>
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

    .vide {
      display: grid;
      place-items: center;
      width: 100%;
      height: 100%;
      background:
        radial-gradient(
          circle at 22% 18%,
          color-mix(in srgb, var(--saes-jaune) 18%, transparent),
          transparent 55%
        ),
        radial-gradient(
          circle at 85% 90%,
          color-mix(in srgb, var(--saes-action) 16%, transparent),
          transparent 55%
        ),
        var(--saes-fond-doux);
    }

    .pastille {
      display: grid;
      place-items: center;
      width: clamp(3.25rem, 34%, 5rem);
      aspect-ratio: 1;
      border: 1px solid var(--saes-bordure);
      border-radius: 50%;
      background: var(--saes-surface);
      box-shadow: var(--saes-ombre);
      color: var(--saes-accent-texte);
    }

    app-icone-categorie {
      display: block;
      width: 52%;
      height: 52%;
    }
  `,
})
export class PhotoPlat {
  readonly nom = input.required<string>();
  readonly categorie = input.required<CategoriePlat>();
  /** Largeur affichee, pour que le navigateur choisisse le fichier de 360 ou de 720 px. */
  readonly taille = input('160px');
  /**
   * Vrai pour les photos visibles des l'arrivee (la premiere categorie du menu) : sur
   * ordinateur, l'une d'elles est la plus grande image de l'ecran, que le navigateur doit
   * charger tout de suite et non en dernier (avertissement Angular NG0913).
   */
  readonly prioritaire = input(false);

  protected readonly photo = computed(() => photoDuPlat(this.nom()));
}
