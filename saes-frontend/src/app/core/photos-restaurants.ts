import { nomDeFichier } from './photos-plats';

/**
 * Photos des restaurants, pour le bandeau de l'ecran des menus. La conception
 * ne donne pas de photo au restaurant : on l'associe par son nom, comme pour
 * les plats. « Restaurant de l'EPT » se lit restaurant-de-l-ept, et ses fichiers
 * sont public/assets/restaurants/restaurant-de-l-ept-400.webp et -800.webp
 * (ratio 1,88, celui du bandeau de l'ecran de reference 1). Un restaurant sans
 * photo n'en affiche pas : celle d'un autre serait fausse pour lui.
 */
const PHOTOS: Record<string, CreditPhoto> = {
  'restaurant-de-l-ept': {
    auteur: 'Tchernodawda',
    licence: 'CC BY-SA 4.0',
    source:
      'https://commons.wikimedia.org/wiki/File:Case_des_polytechniciens_de_l%27%C3%A9cole_polytechnique_de_Thies.jpg',
    description: 'Allée de la case des polytechniciens, École polytechnique de Thiès',
  },
};

/** La licence des photos libres demande de citer leur auteur. */
export interface CreditPhoto {
  auteur: string;
  licence: string;
  source: string;
  description: string;
}

export interface PhotoRestaurant {
  src: string;
  srcset: string;
  credit: CreditPhoto;
}

export function photoDuRestaurant(nomDuRestaurant: string): PhotoRestaurant | null {
  const fichier = nomDeFichier(nomDuRestaurant);
  const credit = PHOTOS[fichier];
  if (!credit) {
    return null;
  }
  const base = `assets/restaurants/${fichier}`;
  return {
    src: `${base}-400.webp`,
    srcset: `${base}-400.webp 400w, ${base}-800.webp 800w`,
    credit,
  };
}

/** Pour la page Confidentialite : toutes les photos a citer. */
export const CREDITS_PHOTOS_RESTAURANTS: CreditPhoto[] = Object.values(PHOTOS);
