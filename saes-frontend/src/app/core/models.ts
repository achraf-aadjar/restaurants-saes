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

export type TypeCommande = 'SUR_PLACE' | 'A_EMPORTER';

export type StatutCommande = 'EN_ATTENTE' | 'EN_PREPARATION' | 'PRETE' | 'PAYEE' | 'ANNULEE' | 'ABANDONNEE';

export type StatutReservation = 'CONFIRMEE' | 'ANNULEE';

export interface LigneDemandeeDto {
  platId: number;
  quantite: number;
}

export interface LigneCommandeDto {
  platId: number;
  platNom: string;
  quantite: number;
  prixUnitaire: number;
}

export interface CommandeDto {
  id: number;
  restaurantId: number;
  tableId: number | null;
  tableNumero: number | null;
  type: TypeCommande;
  statut: StatutCommande;
  dateHeure: string;
  version: number;
  montantTotal: number;
  lignes: LigneCommandeDto[];
}

export interface PasserCommandeRequest {
  restaurantId: number;
  lignes: LigneDemandeeDto[];
}

export interface PrendreCommandeRequest {
  type: TypeCommande;
  tableId?: number | null;
  lignes: LigneDemandeeDto[];
}

export interface ModifierCommandeRequest {
  lignes: LigneDemandeeDto[];
  version: number;
}

export interface ActionAvecVersionRequest {
  version: number;
}

export interface ConflitCommandeResponse {
  motif: string;
  commandeActuelle: CommandeDto;
}

export interface ReservationDto {
  id: number;
  restaurantId: number;
  restaurantNom: string;
  dateHeure: string;
  dureeMinutes: number;
  nombreCouverts: number;
  statut: StatutReservation;
  tables: TableDto[];
}

export interface FaireReservationRequest {
  restaurantId: number;
  dateHeure: string;
  nombreCouverts: number;
}

export interface TableOccupationDto {
  id: number;
  numero: number;
  capacite: number;
  occupee: boolean;
}

export interface OccupationRestaurantDto {
  tables: TableOccupationDto[];
  reservationsDuJour: ReservationDto[];
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
