import {
  Directive,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  inject,
  input,
} from '@angular/core';

/**
 * Donne le focus à l'élément dès qu'il apparaît, si la valeur est vraie (vrai par
 * défaut). Sert aux confirmations dans la carte : le bouton cliqué disparaît au
 * profit de la question, puis revient ; sans cela, le focus du clavier se perdrait
 * au début de la page.
 */
@Directive({ selector: '[appFocusAuRendu]' })
export class FocusAuRendu {
  readonly appFocusAuRendu = input(true, { transform: booleanAttribute });

  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef);
    afterNextRender(() => {
      if (this.appFocusAuRendu()) {
        element.nativeElement.focus();
      }
    });
  }
}
