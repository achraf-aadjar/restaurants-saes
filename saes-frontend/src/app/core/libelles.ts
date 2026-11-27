import { CategoriePlat, JourSemaine, ProfilClient, Role, Unite } from './models';

/** Libelles francais des valeurs envoyees par le serveur : « DESSERT » devient « Dessert ». */

export const LIBELLES_CATEGORIES: Record<CategoriePlat, string> = {
  ENTREE: 'Entrée',
  PLAT_PRINCIPAL: 'Plat principal',
  DESSERT: 'Dessert',
  BOISSON: 'Boisson',
};

/** Les catégories au pluriel, comme titres de groupes de plats. */
export const LIBELLES_CATEGORIES_PLURIEL: Record<CategoriePlat, string> = {
  ENTREE: 'Entrées',
  PLAT_PRINCIPAL: 'Plats principaux',
  DESSERT: 'Desserts',
  BOISSON: 'Boissons',
};

/** Ordre d'affichage des catégories : de l'entrée à la boisson. */
export const ORDRE_CATEGORIES: CategoriePlat[] = ['ENTREE', 'PLAT_PRINCIPAL', 'DESSERT', 'BOISSON'];

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

/** Les deux profils proposes a l'inscription. */
export const LIBELLES_PROFILS: Record<ProfilClient, string> = {
  ETUDIANT: 'Étudiant',
  PROFESSEUR: 'Professeur',
};

export const PROFILS: ProfilClient[] = ['ETUDIANT', 'PROFESSEUR'];
