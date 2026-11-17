import { formatNumber } from '@angular/common';
import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';

/** Montant en FCFA a la francaise : « 20 000 FCFA » (espaces insecables). */
@Pipe({ name: 'montant' })
export class MontantPipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);

  transform(valeur: number | null): string {
    if (valeur === null) return '—';
    return `${formatNumber(valeur, this.locale, '1.0-0')}\u00a0FCFA`;
  }
}
