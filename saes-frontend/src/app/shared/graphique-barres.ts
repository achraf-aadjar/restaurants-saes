import { Component, DestroyRef, ElementRef, afterNextRender, computed, inject, input, signal } from '@angular/core';

export interface SerieGraphique {
  nom: string;
  couleur: string;
}

export interface PointGraphique {
  libelle: string;
  libelleCourt: string;
  valeurs: number[];
}

const HAUTEUR = 220;
const MARGE_GAUCHE = 56;
const MARGE_BAS = 26;
const MARGE_HAUT = 10;

/**
 * Barres verticales empilees (une colonne par point), en SVG, sans bibliotheque :
 * legende toujours visible des 2 series, info-bulle au survol ou au toucher de
 * chaque colonne, grille discrete. Les valeurs exactes sont aussi dans un
 * tableau sur la page (le jaune contraste peu avec le fond).
 */
@Component({
  selector: 'app-graphique-barres',
  template: `
    <div class="legende" aria-hidden="true">
      @for (s of series(); track s.nom) {
        <span class="entree"><span class="pastille" [style.background]="s.couleur"></span>{{ s.nom }}</span>
      }
    </div>
    <div class="zone">
      <svg
        [attr.width]="largeur()"
        [attr.height]="hauteurTotale"
        [attr.viewBox]="'0 0 ' + largeur() + ' ' + hauteurTotale"
        role="img"
        [attr.aria-label]="description()"
      >
        @for (g of graduations(); track g.valeur) {
          <line [attr.x1]="margeGauche" [attr.x2]="largeur()" [attr.y1]="g.y" [attr.y2]="g.y" class="grille" />
          <text [attr.x]="margeGauche - 8" [attr.y]="g.y + 4" class="axe" text-anchor="end">{{ g.libelle }}</text>
        }
        @for (c of colonnes(); track c.index) {
          <g (mouseenter)="survol.set(c.index)" (mouseleave)="survol.set(null)" (click)="survol.set(c.index)">
            <rect [attr.x]="c.xZone" y="0" [attr.width]="c.largeurZone" [attr.height]="hauteurTotale" fill="transparent" />
            @for (seg of c.segments; track $index) {
              <path [attr.d]="seg.chemin" [attr.fill]="seg.couleur" />
            }
            @if (c.afficherLibelle) {
              <text [attr.x]="c.xCentre" [attr.y]="hauteurTotale - 6" class="axe" text-anchor="middle">{{ c.libelleCourt }}</text>
            }
          </g>
        }
        <line [attr.x1]="margeGauche" [attr.x2]="largeur()" [attr.y1]="basGraphique" [attr.y2]="basGraphique" class="base" />
      </svg>
      @if (infoBulle(); as b) {
        <div class="info-bulle" [style.left.%]="b.positionPourcent">
          <strong>{{ b.libelle }}</strong>
          @for (l of b.lignes; track l.nom) {
            <span><span class="pastille" [style.background]="l.couleur"></span>{{ l.nom }} : {{ format(l.valeur) }}</span>
          }
          <span class="total">Total : {{ format(b.total) }}</span>
        </div>
      }
    </div>
  `,
  styles: `
    :host { display: block; }
    .legende { display: flex; flex-wrap: wrap; gap: 1rem; font-size: 0.82rem; color: #4f5a55; margin-bottom: 0.6rem; }
    .entree { display: inline-flex; align-items: center; gap: 0.4rem; }
    .pastille { width: 10px; height: 10px; border-radius: 3px; display: inline-block; flex-shrink: 0; }
    .zone { position: relative; }
    svg { display: block; overflow: visible; }
    .grille { stroke: #ece6d6; stroke-width: 1; vector-effect: non-scaling-stroke; }
    .base { stroke: #c9c1aa; stroke-width: 1; vector-effect: non-scaling-stroke; }
    .axe { fill: #7a817c; font-size: 11px; }
    g { cursor: pointer; }
    .info-bulle {
      position: absolute; top: 0; transform: translateX(-50%);
      background: #fff; border: 1px solid var(--saes-bordure); border-radius: 8px;
      box-shadow: 0 6px 20px rgba(8, 49, 45, 0.12); padding: 0.55rem 0.7rem;
      display: flex; flex-direction: column; gap: 0.2rem; font-size: 0.8rem; color: var(--saes-vert);
      pointer-events: none; white-space: nowrap; z-index: 2;
    }
    .info-bulle span { display: inline-flex; align-items: center; gap: 0.35rem; }
    .total { font-weight: 700; border-top: 1px solid var(--saes-bordure); padding-top: 0.2rem; margin-top: 0.1rem; }
  `,
})
export class GraphiqueBarres {
  readonly points = input.required<PointGraphique[]>();
  readonly series = input.required<SerieGraphique[]>();
  readonly unite = input('FCFA');

  protected readonly hauteurTotale = HAUTEUR + MARGE_BAS;
  protected readonly margeGauche = MARGE_GAUCHE;
  protected readonly basGraphique = HAUTEUR;
  protected readonly survol = signal<number | null>(null);

  private readonly largeurConteneur = signal(600);
  protected readonly largeur = computed(() => Math.max(260, this.largeurConteneur()));

  constructor() {
    const hote = inject(ElementRef<HTMLElement>);
    const destruction = inject(DestroyRef);
    afterNextRender(() => {
      const mesurer = () => this.largeurConteneur.set(Math.floor(hote.nativeElement.clientWidth));
      mesurer();
      const observateur = new ResizeObserver(mesurer);
      observateur.observe(hote.nativeElement);
      destruction.onDestroy(() => observateur.disconnect());
    });
  }

  private readonly maximum = computed(() => {
    const max = Math.max(0, ...this.points().map((p) => p.valeurs.reduce((a, b) => a + b, 0)));
    if (max === 0) return 1000;
    const puissance = 10 ** Math.floor(Math.log10(max));
    return Math.ceil(max / puissance) * puissance;
  });

  protected readonly graduations = computed(() =>
    [0, 0.25, 0.5, 0.75, 1].map((f) => {
      const valeur = this.maximum() * f;
      return { valeur, y: HAUTEUR - (HAUTEUR - MARGE_HAUT) * f, libelle: this.court(valeur) };
    }),
  );

  protected readonly colonnes = computed(() => {
    const pts = this.points();
    const pas = (this.largeur() - MARGE_GAUCHE) / Math.max(1, pts.length);
    const largeurBarre = Math.min(28, pas * 0.62);
    const echelle = (HAUTEUR - MARGE_HAUT) / this.maximum();
    const frequenceLibelles = Math.ceil(pts.length / 10);
    return pts.map((p, index) => {
      const x = MARGE_GAUCHE + pas * index + (pas - largeurBarre) / 2;
      let bas = HAUTEUR;
      const nonNuls = p.valeurs.map((v, i) => ({ v, i })).filter((s) => s.v > 0);
      const segments = nonNuls.map((s, rang) => {
        const h = s.v * echelle;
        const haut = bas - h;
        const dernier = rang === nonNuls.length - 1;
        const chemin = this.rectangle(x, haut, largeurBarre, Math.max(0, h - (dernier ? 0 : 2)), dernier ? 4 : 0);
        bas = haut;
        return { chemin, couleur: this.series()[s.i]?.couleur ?? '#999' };
      });
      return {
        index,
        segments,
        xZone: MARGE_GAUCHE + pas * index,
        largeurZone: pas,
        xCentre: x + largeurBarre / 2,
        libelleCourt: p.libelleCourt,
        afficherLibelle: index % frequenceLibelles === 0 || index === pts.length - 1,
      };
    });
  });

  protected readonly infoBulle = computed(() => {
    const i = this.survol();
    if (i === null) return null;
    const p = this.points()[i];
    const c = this.colonnes()[i];
    const lignes = this.series().map((s, k) => ({ nom: s.nom, couleur: s.couleur, valeur: p.valeurs[k] ?? 0 }));
    const pourcent = Math.min(85, Math.max(15, (c.xCentre / this.largeur()) * 100));
    return { libelle: p.libelle, lignes, total: lignes.reduce((a, l) => a + l.valeur, 0), positionPourcent: pourcent };
  });

  protected readonly description = computed(() => {
    const total = this.points().reduce((a, p) => a + p.valeurs.reduce((x, y) => x + y, 0), 0);
    return `Graphique en barres de ${this.points().length} jours, total ${this.format(total)}`;
  });

  protected format(valeur: number): string {
    return `${Math.round(valeur).toLocaleString('fr-FR')} ${this.unite()}`;
  }

  private court(valeur: number): string {
    if (valeur >= 1_000_000) return `${(valeur / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M`;
    if (valeur >= 1000) return `${(valeur / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} k`;
    return String(Math.round(valeur));
  }

  /** Rectangle dont seuls les coins du haut sont arrondis (bout de donnee). */
  private rectangle(x: number, y: number, l: number, h: number, r: number): string {
    const rayon = Math.min(r, h, l / 2);
    return `M${x},${y + h} V${y + rayon} Q${x},${y} ${x + rayon},${y} H${x + l - rayon} Q${x + l},${y} ${x + l},${y + rayon} V${y + h} Z`;
  }
}
