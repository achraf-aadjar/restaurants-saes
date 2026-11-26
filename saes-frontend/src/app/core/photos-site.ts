/**
 * Photos de la vitrine : l'image d'ouverture de l'accueil et la galerie.
 *
 * Pour mettre vos propres photos :
 *   1. deposer les fichiers dans `saes-frontend/public/assets/site/` ;
 *   2. ajouter leur nom ci-dessous, avec une legende.
 *
 * Deux tailles par photo, en .webp : `<nom>-800.webp` et `<nom>-1600.webp`
 * pour l'ouverture (paysage), `<nom>-400.webp` et `<nom>-800.webp` pour la
 * galerie. Le navigateur choisit la bonne selon l'ecran.
 *
 * En attendant, la vitrine se sert des photos deja presentes dans le depot
 * (les plats et le restaurant) : la page n'est jamais vide.
 */

export interface PhotoSite {
  /** Chemin du fichier, sans la taille ni l'extension. */
  base: string;
  /** Les deux largeurs disponibles, en pixels. */
  tailles: [number, number];
  legende: string;
}

/** Grande image de l'ouverture de la page d'accueil (format paysage). */
export const PHOTO_OUVERTURE: PhotoSite = {
  base: 'assets/restaurants/restaurant-de-l-ept',
  tailles: [400, 800],
  legende: "La terrasse du restaurant de l'EPT",
};

/** Galerie de la page « Photos », dans l'ordre d'affichage. */
export const GALERIE: PhotoSite[] = [
  {
    base: 'assets/plats/thieboudienne',
    tailles: [360, 720],
    legende: 'Thiéboudienne, riz au poisson et légumes',
  },
  {
    base: 'assets/plats/yassa-poulet',
    tailles: [360, 720],
    legende: 'Yassa poulet, oignons confits et citron',
  },
  {
    base: 'assets/plats/mafe',
    tailles: [360, 720],
    legende: "Mafé, sauce à l'arachide",
  },
  {
    base: 'assets/restaurants/restaurant-de-l-ept',
    tailles: [400, 800],
    legende: "La terrasse du restaurant de l'EPT",
  },
  {
    base: 'assets/plats/jus-de-bissap',
    tailles: [360, 720],
    legende: "Jus de bissap, infusion d'hibiscus",
  },
  {
    base: 'assets/plats/thiakry',
    tailles: [360, 720],
    legende: 'Thiakry, couscous de mil au lait caillé',
  },
  {
    base: 'assets/plats/jus-de-bouye',
    tailles: [360, 720],
    legende: 'Jus de bouye, pulpe de fruit du baobab',
  },
];

/** `src` et `srcset` d'une photo, pour une balise `img`. */
export function sourcesDe(photo: PhotoSite): { src: string; srcset: string } {
  const [petite, grande] = photo.tailles;
  return {
    src: `${photo.base}-${petite}.webp`,
    srcset: `${photo.base}-${petite}.webp ${petite}w, ${photo.base}-${grande}.webp ${grande}w`,
  };
}
