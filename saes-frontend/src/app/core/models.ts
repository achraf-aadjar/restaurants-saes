export type Role = 'CLIENT' | 'SERVEUR' | 'CUISINIER' | 'CAISSIER' | 'GERANT' | 'ADMINISTRATEUR';

export type CategoriePlat = 'ENTREE' | 'PLAT_PRINCIPAL' | 'DESSERT' | 'BOISSON';

export type JourSemaine =
  | 'LUNDI'
  | 'MARDI'
  | 'MERCREDI'
  | 'JEUDI'
  | 'VENDREDI'
  | 'SAMEDI'
  | 'DIMANCHE';

export interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  roles: Role[];
  restaurantId: number | null;
  restaurantNom: string | null;
  estActif: boolean;
}

export interface AuthResponse {
  token: string;
  utilisateur: Utilisateur;
}

export interface InscriptionRequest {
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  telephone?: string;
}

export interface LoginRequest {
  email: string;
  motDePasse: string;
}

export interface CompteUpdateRequest {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  nouveauMotDePasse?: string;
}

export interface CreateStaffRequest {
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  telephone?: string;
  restaurantId: number;
  roles: Role[];
}

export interface PlatResume {
  id: number;
  nom: string;
  description: string | null;
  prix: number;
  categorie: CategoriePlat;
}

export interface MenuDto {
  id: number;
  nom: string;
  dateDebut: string;
  dateFin: string | null;
  plats: PlatResume[];
}

export interface RestaurantSummary {
  id: number;
  nom: string;
  adresse: string;
  telephone: string | null;
}

export interface TableDto {
  id?: number;
  numero: number;
  capacite: number;
}

export interface HoraireDto {
  id?: number;
  jour: JourSemaine;
  heureOuverture: string;
  heureFermeture: string;
}

export interface RestaurantDto {
  id: number;
  nom: string;
  adresse: string;
  telephone: string | null;
  dureeReservationMinutes: number;
  estActif: boolean;
  tables: TableDto[];
  horaires: HoraireDto[];
}

export interface RestaurantSaveRequest {
  nom: string;
  adresse: string;
  telephone?: string;
  dureeReservationMinutes: number;
  tables: TableDto[];
  horaires: HoraireDto[];
}

export const JOURS_SEMAINE: JourSemaine[] = [
  'LUNDI',
  'MARDI',
  'MERCREDI',
  'JEUDI',
  'VENDREDI',
  'SAMEDI',
  'DIMANCHE',
];

export const ROLES: Role[] = ['SERVEUR', 'CUISINIER', 'CAISSIER', 'GERANT'];
