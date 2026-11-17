/**
 * Photos des plats (illustrations temporaires). La conception ne donne pas de
 * photo au plat : on l'associe par son nom. « Yassa poulet » se lit
 * yassa-poulet, et ses fichiers sont public/assets/plats/yassa-poulet-360.webp
 * et yassa-poulet-720.webp (ratio 9:10, celui des cartes de l'ecran de
 * reference 1b).
 *
 * Remplacer une photo : remplacer ses deux fichiers, sous le meme nom.
 * Ajouter une photo : ajouter ses deux fichiers et son nom ci-dessous.
 * Un plat sans photo affiche l'icone de sa categorie.
 */
const PLATS_AVEC_PHOTO = new Set([
  'thieboudienne',
  'yassa-poulet',
  'mafe',
  'thiakry',
  'jus-de-bissap',
  'jus-de-bouye',
]);

export interface FichiersPhoto {
  src: string;
  srcset: string;
}

/** « Thiéboudienne » donne thieboudienne, « Jus de bissap » donne jus-de-bissap. */
export function nomDeFichier(nomDuPlat: string): string {
  return nomDuPlat
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function photoDuPlat(nomDuPlat: string): FichiersPhoto | null {
  const fichier = nomDeFichier(nomDuPlat);
  if (!PLATS_AVEC_PHOTO.has(fichier)) {
    return null;
  }
  const base = `assets/plats/${fichier}`;
  return { src: `${base}-360.webp`, srcset: `${base}-360.webp 360w, ${base}-720.webp 720w` };
}
