import { Component, input, output } from '@angular/core';

/**
 * − 2 + dans une pilule, comme sur l'ecran de reference 1 : dans le panier, et
 * sur la carte d'un plat deja ajoute (Baymard, « Add to Cart » qui devient un
 * choix de quantite).
 */
@Component({
  selector: 'app-compteur-quantite',
  template: `
    <button type="button" (click)="moins.emit()" [attr.aria-label]="'Un de moins : ' + nom()">
      −
    </button>
    <span>{{ quantite() }}</span>
    <button type="button" (click)="plus.emit()" [attr.aria-label]="'Un de plus : ' + nom()">
      +
    </button>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      border: 1px solid rgb(8 49 45 / 14%);
      border-radius: 999px;
      background: #fff;
    }

    button {
      width: 2.2em;
      height: 2.2em;
      border: none;
      background: none;
      color: var(--saes-vert);
      font-size: 1.05rem;
      cursor: pointer;
      border-radius: 999px;

      &:hover {
        background: var(--saes-creme);
      }

      &:focus-visible {
        outline: 2px solid var(--saes-vert);
        outline-offset: -2px;
      }

      /* Au doigt, 44 px, comme le compteur du serveur ; a la souris, la taille
         de l'ecran (37 px). */
      @media (pointer: coarse) {
        width: 2.75rem;
        height: 2.75rem;
      }
    }

    span {
      min-width: 1.6em;
      text-align: center;
      font-weight: 600;
    }
  `,
  host: { role: 'group', '[attr.aria-label]': "'Quantité de ' + nom()" },
})
export class CompteurQuantite {
  readonly quantite = input.required<number>();
  readonly nom = input.required<string>();
  readonly moins = output();
  readonly plus = output();
}
