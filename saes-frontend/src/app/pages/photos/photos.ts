import { Component, signal } from '@angular/core';

import { GALERIE, PhotoSite, sourcesDe } from '../../core/photos-site';

/**
 * Page « Photos » : la galerie du restaurant. Cliquer une photo l'ouvre en
 * grand ; Echap ou un clic en dehors la referme. Les photos et leurs legendes
 * se changent dans `core/photos-site.ts`.
 *
 * Cette page est un ajout hors du cahier des charges (voir REFONTE_PLAN.md).
 */
@Component({
  selector: 'app-photos',
  templateUrl: './photos.html',
  styleUrl: './photos.scss',
})
export class Photos {
  protected readonly galerie = GALERIE;
  protected readonly sources = sourcesDe;
  protected readonly ouverte = signal<PhotoSite | null>(null);

  protected ouvrir(photo: PhotoSite): void {
    this.ouverte.set(photo);
  }

  protected fermer(): void {
    this.ouverte.set(null);
  }
}
