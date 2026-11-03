export type Role = 'CLIENT' | 'SERVEUR' | 'CUISINIER' | 'CAISSIER' | 'GERANT' | 'ADMINISTRATEUR';

export type CategoriePlat = 'ENTREE' | 'PLAT_PRINCIPAL' | 'DESSERT' | 'BOISSON';

export type JourSemaine =
  'LUNDI' | 'MARDI' | 'MERCREDI' | 'JEUDI' | 'VENDREDI' | 'SAMEDI' | 'DIMANCHE';

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
  motDePasseActuel?: string;
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

export const ROLES_PERSONNEL: Role[] = ['SERVEUR', 'CUISINIER', 'CAISSIER', 'GERANT'];

export const TOUS_LES_ROLES: Role[] = ['CLIENT', ...ROLES_PERSONNEL, 'ADMINISTRATEUR'];

export type Unite = 'GRAMME' | 'KILOGRAMME' | 'MILLILITRE' | 'LITRE' | 'PIECE';

export const UNITES: Unite[] = ['GRAMME', 'KILOGRAMME', 'MILLILITRE', 'LITRE', 'PIECE'];

export type TypeMouvement = 'ENTREE' | 'SORTIE';

export type ModePaiement = 'ESPECES' | 'MOBILE_MONEY';

/** Gerer les plats (cahier des charges §4.2), cote gerant. */
export interface RecetteLigneDto {
  ingredientId: number;
  ingredientNom?: string;
  unite?: Unite;
  quantiteNecessaire: number;
}

export interface PlatGerantDto {
  id: number;
  nom: string;
  description: string | null;
  prix: number;
  categorie: CategoriePlat;
  estActif: boolean;
  recette: RecetteLigneDto[];
}

export interface PlatSaveRequest {
  nom: string;
  description?: string;
  prix: number;
  categorie: CategoriePlat;
  recette: RecetteLigneDto[];
}

/** Gerer les menus (cahier des charges §4.2), cote gerant. */
export interface MenuGerantDto {
  id: number;
  nom: string;
  dateDebut: string;
  dateFin: string | null;
  plats: PlatResume[];
}

export interface MenuSaveRequest {
  nom: string;
  dateDebut: string;
  dateFin?: string | null;
  platIds: number[];
}

/** Gerer les stocks (cahier des charges §4.6), cote gerant. */
export interface IngredientDto {
  id: number;
  nom: string;
  unite: Unite;
  seuilAlerte: number;
  niveauCible: number;
  stock: number;
  alerte: boolean;
}

export interface IngredientSaveRequest {
  nom: string;
  unite: Unite;
  seuilAlerte: number;
  niveauCible: number;
}

export interface MouvementStockRequest {
  type: TypeMouvement;
  quantite: number;
}

/** Consulter les recommandations d'approvisionnement (§4.6), cote gerant. */
export interface RecommandationDto {
  ingredientId: number;
  nom: string;
  unite: Unite;
  stock: number;
  niveauCible: number;
  quantiteARecommander: number;
  consommationMoyenneParSemaine: number;
}

/** Finances (cahier des charges §4.5), cote caissier. */
export interface SessionCaisseDto {
  id: number;
  dateHeureOuverture: string;
  fondDeCaisse: number;
  dateHeureCloture: string | null;
  montantCompte: number | null;
  montantTheorique: number | null;
  ecart: number | null;
}

export interface OuvrirCaisseRequest {
  fondDeCaisse: number;
}

export interface ClotureCaisseRequest {
  montantCompte: number;
}

export interface EncaisserRequest {
  modePaiement: ModePaiement;
  version: number;
}

/** Consulter les rapports financiers (§4.5), cote gerant. */
export interface EncaissementJourDto {
  jour: string;
  montantEspeces: number;
  montantMobileMoney: number;
}

export interface EcartCaisseDto {
  sessionId: number;
  caissierNom: string;
  dateHeureOuverture: string;
  dateHeureCloture: string;
  fondDeCaisse: number;
  montantTheorique: number;
  montantCompte: number;
  ecart: number;
}

export interface RapportFinancierDto {
  encaissementsParJour: EncaissementJourDto[];
  ecartsCaisse: EcartCaisseDto[];
  montantCommandesAbandonnees: number;
}

/** Consulter les statistiques de ventes (§4.6), cote gerant. */
export interface VenteParPlatDto {
  platId: number;
  nom: string;
  categorie: CategoriePlat;
  quantiteVendue: number;
  montant: number;
}

export interface VenteParCategorieDto {
  categorie: CategoriePlat;
  quantiteVendue: number;
  montant: number;
}

export interface StatistiquesVentesDto {
  nombreCommandesPayees: number;
  montantMoyen: number;
  parPlat: VenteParPlatDto[];
  parCategorie: VenteParCategorieDto[];
}
