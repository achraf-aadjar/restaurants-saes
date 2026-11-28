import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';

import { ThemeService } from '../core/theme.service';

Chart.register(
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
);

export type FormeGraphique = 'ligne' | 'barres' | 'barres-horizontales' | 'anneau';

export interface SerieGraphique {
  libelle: string;
  valeurs: number[];
  /** Numero de serie (1 a 6) ; sans lui, les series sont numerotees dans l'ordre. */
  serie?: number;
}

/** Couleur d'une serie, lue dans le theme en cours. */
function couleurSerie(styles: CSSStyleDeclaration, numero: number): string {
  return styles.getPropertyValue(`--saes-serie-${((numero - 1) % 6) + 1}`).trim();
}

/**
 * Un graphique du tableau de bord, dessine avec Chart.js.
 *
 * Les couleurs, la grille et les textes viennent des variables du theme : le
 * graphique se redessine tout seul quand on passe du mode clair au mode sombre.
 * Les couleurs de series sont posees dans un ordre fixe, pour qu'une categorie
 * garde la meme couleur d'un ecran a l'autre et d'un filtre a l'autre.
 *
 * Un graphique n'est pas lisible par un lecteur d'ecran : le meme contenu est
 * donc toujours ecrit dans un tableau, place hors de l'ecran, et les pages qui
 * portent ces graphiques montrent aussi leurs chiffres en toutes lettres.
 */
@Component({
  selector: 'app-graphique',
  template: `
    <figure>
      <div class="toile" [style.height.px]="hauteur()">
        <canvas #toile></canvas>
      </div>
      <figcaption class="hors-ecran">
        <table>
          <caption>
            {{
              titre()
            }}
          </caption>
          <thead>
            <tr>
              <th scope="col">{{ intituleAxe() }}</th>
              @for (s of series(); track s.libelle) {
                <th scope="col">{{ s.libelle }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (etiquette of etiquettes(); track etiquette; let i = $index) {
              <tr>
                <th scope="row">{{ etiquette }}</th>
                @for (s of series(); track s.libelle) {
                  <td>{{ s.valeurs[i] }}</td>
                }
              </tr>
            }
          </tbody>
        </table>
      </figcaption>
    </figure>
  `,
  styles: `
    :host {
      display: block;
    }

    figure {
      margin: 0;
    }

    .toile {
      position: relative;
      width: 100%;
    }

    .hors-ecran {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
  `,
})
export class Graphique implements AfterViewInit {
  readonly forme = input<FormeGraphique>('ligne');
  readonly etiquettes = input.required<string[]>();
  readonly series = input.required<SerieGraphique[]>();
  readonly hauteur = input(240);
  /** Lu par les lecteurs d'ecran, en legende du tableau equivalent. */
  readonly titre = input.required<string>();
  readonly intituleAxe = input('Période');
  /** Mise en forme d'une valeur dans l'infobulle (montant, quantite...). */
  readonly formatValeur = input<(valeur: number) => string>((v) => String(v));
  /** Les barres s'empilent au lieu d'etre cote a cote. */
  readonly empile = input(false);

  private readonly toile = viewChild.required<ElementRef<HTMLCanvasElement>>('toile');
  private readonly theme = inject(ThemeService);
  private graphique: Chart | null = null;
  private pret = false;

  constructor() {
    // Redessine a chaque changement de donnees ou de theme.
    effect(() => {
      this.forme();
      this.etiquettes();
      this.series();
      this.empile();
      this.theme.sombre();
      if (this.pret) this.dessiner();
    });
    inject(DestroyRef).onDestroy(() => this.graphique?.destroy());
  }

  ngAfterViewInit(): void {
    this.pret = true;
    this.dessiner();
  }

  private dessiner(): void {
    this.graphique?.destroy();

    const styles = getComputedStyle(document.documentElement);
    const encre = styles.getPropertyValue('--saes-vert').trim();
    const encreDouce = styles.getPropertyValue('--saes-vert-attenue').trim();
    const grille = styles.getPropertyValue('--saes-grille').trim();
    const surface = styles.getPropertyValue('--saes-surface').trim();
    const forme = this.forme();
    const anneau = forme === 'anneau';
    const horizontal = forme === 'barres-horizontales';

    const jeux = this.series().map((s, i) => {
      const couleur = couleurSerie(styles, s.serie ?? i + 1);
      if (anneau) {
        return {
          label: s.libelle,
          data: s.valeurs,
          backgroundColor: s.valeurs.map((_, j) => couleurSerie(styles, j + 1)),
          // Un filet de la couleur du fond separe deux parts voisines.
          borderColor: surface,
          borderWidth: 2,
          hoverOffset: 6,
        };
      }
      if (forme === 'ligne') {
        return {
          label: s.libelle,
          data: s.valeurs,
          borderColor: couleur,
          backgroundColor: `color-mix(in srgb, ${couleur} 14%, transparent)`,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointBackgroundColor: couleur,
          pointBorderColor: surface,
          pointBorderWidth: 2,
          tension: 0.32,
          fill: true,
        };
      }
      return {
        label: s.libelle,
        data: s.valeurs,
        backgroundColor: couleur,
        borderRadius: 4,
        borderSkipped: false,
        // Un filet de la couleur du fond separe deux barres collees.
        borderColor: surface,
        borderWidth: this.empile() ? 2 : 0,
        maxBarThickness: 44,
      };
    });

    const axeValeurs = {
      stacked: this.empile(),
      beginAtZero: true,
      border: { display: false },
      grid: { color: grille, drawTicks: false },
      ticks: {
        color: encreDouce,
        padding: 8,
        callback: (valeur: string | number) => this.formatValeur()(Number(valeur)),
      },
    };
    const axeEtiquettes = {
      stacked: this.empile(),
      border: { color: grille },
      grid: { display: false },
      ticks: { color: encreDouce, padding: 6, autoSkipPadding: 16 },
    };

    this.graphique = new Chart(this.toile().nativeElement, {
      type: anneau ? 'doughnut' : forme === 'ligne' ? 'line' : 'bar',
      data: { labels: this.etiquettes(), datasets: jeux as never },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        // Un tableau de bord se lit, il ne se regarde pas s'animer : le
        // graphique apparait a sa place, sans mouvement d'entree.
        animation: false,
        animations: {},
        indexAxis: horizontal ? 'y' : 'x',
        interaction: { mode: anneau ? 'nearest' : 'index', intersect: anneau },
        layout: { padding: anneau ? 4 : 0 },
        cutout: anneau ? '62%' : undefined,
        scales: (anneau
          ? undefined
          : horizontal
            ? { x: axeValeurs, y: axeEtiquettes }
            : { x: axeEtiquettes, y: axeValeurs }) as never,
        plugins: {
          // La legende n'apparait qu'a partir de deux series : avec une seule,
          // le titre de la carte dit deja ce qui est mesure.
          legend: {
            display: anneau || this.series().length > 1,
            position: anneau ? 'bottom' : 'top',
            align: 'start',
            labels: {
              color: encre,
              boxWidth: 10,
              boxHeight: 10,
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 14,
              font: { family: styles.getPropertyValue('--saes-font'), size: 12, weight: 600 },
            },
          },
          tooltip: {
            backgroundColor: styles.getPropertyValue('--saes-surface-haute').trim(),
            titleColor: encre,
            bodyColor: encre,
            borderColor: styles.getPropertyValue('--saes-bordure').trim(),
            borderWidth: 1,
            padding: 10,
            cornerRadius: 10,
            displayColors: true,
            usePointStyle: true,
            titleFont: { family: styles.getPropertyValue('--saes-font'), weight: 700 },
            bodyFont: { family: styles.getPropertyValue('--saes-font') },
            callbacks: {
              label: (contexte) => {
                const valeur = anneau
                  ? Number(contexte.parsed)
                  : Number((contexte.parsed as { x: number; y: number })[horizontal ? 'x' : 'y']);
                const nom = anneau ? contexte.label : contexte.dataset.label;
                return ` ${nom} : ${this.formatValeur()(valeur)}`;
              },
            },
          },
        },
      },
    });
  }
}
