/**
 * Montants abreges pour les axes et les infobulles des graphiques : un axe ne
 * peut pas porter « 1 250 000 FCFA » a chaque graduation. Les montants exacts
 * restent ecrits en toutes lettres dans les tableaux des memes pages.
 */
export function enFrancsCourt(montant: number): string {
  const valeur = Math.round(montant);
  if (Math.abs(valeur) >= 1_000_000) {
    return `${(valeur / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M FCFA`;
  }
  if (Math.abs(valeur) >= 10_000) {
    return `${Math.round(valeur / 1000).toLocaleString('fr-FR')} k FCFA`;
  }
  return `${valeur.toLocaleString('fr-FR')} FCFA`;
}

/** Quantites : « 349 », sans unite. */
export function enQuantite(valeur: number): string {
  return Math.round(valeur).toLocaleString('fr-FR');
}
