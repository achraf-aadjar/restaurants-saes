import { formatNumber } from '@angular/common';
import { inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';

import { SYMBOLES_UNITES } from '../core/libelles';
import { Unite } from '../core/models';

/**
 * Quantite d'un ingredient dans son unite (cahier des charges, regle 12), a la
 * francaise : « 2 000 g », « 0,3 kg », « 2 pièces » (espaces insecables).
 */
@Pipe({ name: 'quantite' })
export class QuantitePipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);

  transform(valeur: number | null, unite: Unite): string {
    if (valeur === null) return '—';
    // Au pluriel a partir de 2, comme en francais : « 1,5 pièce », « 2 pièces ».
    const symbole = unite === 'PIECE' && Math.abs(valeur) >= 2 ? 'pièces' : SYMBOLES_UNITES[unite];
    return `${formatNumber(valeur, this.locale, '1.0-3')}\u00a0${symbole}`;
  }
}
