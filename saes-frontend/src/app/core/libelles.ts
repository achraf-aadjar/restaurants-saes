import { CategoriePlat, JourSemaine, Role, Unite } from './models';

/** Libelles francais des valeurs envoyees par le serveur : « DESSERT » devient « Dessert ». */

export const LIBELLES_CATEGORIES: Record<CategoriePlat, string> = {
  ENTREE: 'Entrée',
  PLAT_PRINCIPAL: 'Plat principal',
  DESSERT: 'Dessert',
  BOISSON: 'Boisson',
};

export const LIBELLES_ROLES: Record<Role, string> = {
  CLIENT: 'Client',
  SERVEUR: 'Serveur',
  CUISINIER: 'Cuisinier',
  CAISSIER: 'Caissier',
  GERANT: 'Gérant',
  ADMINISTRATEUR: 'Administrateur',
};

export const LIBELLES_JOURS: Record<JourSemaine, string> = {
  LUNDI: 'Lundi',
  MARDI: 'Mardi',
  MERCREDI: 'Mercredi',
  JEUDI: 'Jeudi',
  VENDREDI: 'Vendredi',
  SAMEDI: 'Samedi',
  DIMANCHE: 'Dimanche',
};

/** Unites du cahier des charges (Gerer les stocks). */
export const LIBELLES_UNITES: Record<Unite, string> = {
  GRAMME: 'Gramme',
  KILOGRAMME: 'Kilogramme',
  MILLILITRE: 'Millilitre',
  LITRE: 'Litre',
  PIECE: 'Pièce',
};

/** Symbole ecrit apres une quantite : « 150 g », comme sur l'ecran de reference 4. */
export const SYMBOLES_UNITES: Record<Unite, string> = {
  GRAMME: 'g',
  KILOGRAMME: 'kg',
  MILLILITRE: 'ml',
  LITRE: 'L',
  PIECE: 'pièce',
};
