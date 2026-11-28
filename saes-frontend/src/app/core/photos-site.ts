/**
 * Photos de la vitrine utilisees par la page « Traiteur ».
 *
 * REGLE DE NETTETE : une photo n'est jamais etiree en fond de page. Un ecran
 * Retina affiche deux fois plus de pixels que de pixels CSS, donc une photo de
 * 800 px de large ne reste nette que dans un cadre d'environ 400 px CSS, et une
 * photo de 1280 px dans un cadre d'environ 640 px. Chaque photo est donc posee
 * dans un cadre a sa taille. Pour une photo plein ecran, il faut une source
 * d'au moins 2400 px de large.
 *
 * Pour ajouter une photo :
 *   1. deposer ses fichiers .webp dans `saes-frontend/public/assets/site/`, sous
 *      la forme `<nom>-<largeur>.webp` (ex. `salle-vue-ensemble-800.webp`) ;
 *   2. l'ajouter ci-dessous avec ses largeurs reelles, ses dimensions et sa legende.
 */

export interface PhotoSite {
  /** Chemin du fichier, sans la largeur ni l'extension. */
  base: string;
  /** Les deux largeurs disponibles, en pixels, de la plus petite a la plus grande. */
  tailles: [number, number];
  /** Dimensions de la plus grande, pour reserver la place avant le chargement. */
  largeur: number;
  hauteur: number;
  legende: string;
}

export const SALLE_TABLES_ROUGES: PhotoSite = {
  base: 'assets/site/salle-tables-rouges',
  tailles: [400, 800],
  largeur: 800,
  hauteur: 600,
  legende: 'Les tables rouges près des fenêtres',
};

export const SALLE_ALLEE_CENTRALE: PhotoSite = {
  base: 'assets/site/salle-allee-centrale',
  tailles: [400, 800],
  largeur: 800,
  hauteur: 600,
  legende: 'La salle depuis l’allée centrale',
};

/** `src` et `srcset` d'une photo, pour une balise `img`. */
export function sourcesDe(photo: PhotoSite): { src: string; srcset: string } {
  const [petite, grande] = photo.tailles;
  return {
    src: `${photo.base}-${petite}.webp`,
    srcset: `${photo.base}-${petite}.webp ${petite}w, ${photo.base}-${grande}.webp ${grande}w`,
  };
}
