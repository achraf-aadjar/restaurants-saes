import { formatDate } from '@angular/common';

/** Jour en lettres ; le premier du mois s'ecrit « 1er », comme en francais. */
function jourEnLettres(date: string, format: string, locale: string): string {
  return formatDate(date, format, locale).replace(/ 1( |$)/, ' 1er$1');
}

/**
 * Periode d'un menu en toutes lettres, comme sur l'ecran de reference 1 :
 * « Du lundi 19 au dimanche 25 octobre 2026 ». Le mois et l'annee du debut
 * ne s'ecrivent que s'ils different de ceux de la fin.
 */
export function periodeEnLettres(debut: string, fin: string | null, locale: string): string {
  const complet = 'EEEE d MMMM y';
  if (!fin) return `À partir du ${jourEnLettres(debut, complet, locale)}`;
  if (fin === debut) return `Le ${jourEnLettres(debut, complet, locale)}`;
  const formatDebut =
    debut.slice(0, 7) === fin.slice(0, 7)
      ? 'EEEE d'
      : debut.slice(0, 4) === fin.slice(0, 4)
        ? 'EEEE d MMMM'
        : complet;
  return `Du ${jourEnLettres(debut, formatDebut, locale)} au ${jourEnLettres(fin, complet, locale)}`;
}

/** Heure d'un horaire, comme sur l'ecran de reference 1 : « 11 h 30 », « 15 h ». */
export function heureEnLettres(heure: string): string {
  const [h, m] = heure.split(':');
  return m === '00' ? `${Number(h)} h` : `${Number(h)} h ${m}`;
}

/** Vrai si l'instant tombe aujourd'hui, a l'heure de l'appareil. */
export function estAujourdhui(dateHeure: string, maintenant = new Date()): boolean {
  return new Date(dateHeure).toDateString() === maintenant.toDateString();
}
