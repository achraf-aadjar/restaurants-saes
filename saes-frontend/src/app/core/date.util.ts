import { formatDate } from '@angular/common';

/**
 * Heure pour le pipe date : « 0 h 38 », avec des espaces insecables, pour que
 * l'heure ne se coupe jamais en fin de ligne (« 0 » puis « h 38 »).
 */
export const FORMAT_HEURE = "H\u00a0'h'\u00a0mm";

/** Format par defaut du pipe date : « 03/11/2026 à 13 h 53 », heure insecable. */
export const FORMAT_DATE_HEURE = "dd/MM/y 'à' " + FORMAT_HEURE;

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
