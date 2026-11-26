import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

type Theme = 'clair' | 'sombre';

const CLE = 'saes_theme';

/**
 * Mode clair ou sombre. Au premier passage, on suit le reglage du systeme ;
 * ensuite, le choix de l'utilisateur est garde dans ce navigateur (comme la
 * session). Le theme se pose sur <html data-theme="dark"> : toutes les couleurs
 * du site viennent de variables CSS (styles.scss) qui changent avec lui.
 * Un petit script de index.html pose le meme attribut avant le premier
 * affichage, pour qu'on ne voie pas un eclair blanc au chargement.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  private readonly theme = signal<Theme>(this.themeInitial());

  readonly sombre = computed(() => this.theme() === 'sombre');

  constructor() {
    this.appliquer(this.theme());
  }

  basculer(): void {
    const suivant: Theme = this.sombre() ? 'clair' : 'sombre';
    this.theme.set(suivant);
    this.appliquer(suivant);
    try {
      localStorage.setItem(CLE, suivant);
    } catch {
      // Stockage bloque (navigation privee) : le choix vaut pour cette visite.
    }
  }

  private themeInitial(): Theme {
    try {
      const garde = localStorage.getItem(CLE);
      if (garde === 'clair' || garde === 'sombre') {
        return garde;
      }
    } catch {
      // Pas de stockage : on suit le systeme.
    }
    const fenetre = this.document.defaultView;
    return fenetre?.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'sombre' : 'clair';
  }

  private appliquer(theme: Theme): void {
    const racine = this.document.documentElement;
    if (theme === 'sombre') {
      racine.setAttribute('data-theme', 'dark');
    } else {
      racine.removeAttribute('data-theme');
    }
  }
}
