import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { JournalOperation } from './journal.service';
import {
  CategoriePlat,
  EncaissementJourDto,
  ModePaiement,
  Role,
  StatutCommande,
  StatutReservation,
  TypeCommande,
  Unite,
} from './models';

export interface Indicateurs {
  restaurantsActifs: number;
  restaurantsDesactives: number;
  comptesActifs: number;
  comptesDesactives: number;
  comptesParRole: Record<Role, number>;
  commandesEnCours: Partial<Record<StatutCommande, number>>;
  caissesOuvertes: number;
  reservationsAujourdhui: number;
  ingredientsEnAlerte: number;
}

export interface FinancesSupervision {
  chiffreAffaires: number;
  encaisseEspeces: number;
  encaisseMobileMoney: number;
  commandesPayees: number;
  panierMoyen: number;
  montantAbandonne: number;
  parJour: EncaissementJourDto[];
  parRestaurant: { restaurantId: number; restaurant: string; chiffreAffaires: number; commandesPayees: number }[];
}

export interface TableauDeBord {
  indicateurs: Indicateurs;
  finances: FinancesSupervision;
  meilleursPlats: { plat: string; restaurant: string; categorie: CategoriePlat; quantite: number; montant: number }[];
  activiteRecente: JournalOperation[];
}

export interface CommandeSupervision {
  id: number;
  restaurant: string;
  dateHeure: string;
  type: TypeCommande;
  tableNumero: number | null;
  passeePar: string | null;
  statut: StatutCommande;
  montantTotal: number;
  lignes: string;
  modePaiement: ModePaiement | null;
}

export interface ReservationSupervision {
  id: number;
  restaurant: string;
  client: string;
  dateHeure: string;
  dureeMinutes: number;
  nombreCouverts: number;
  statut: StatutReservation;
  tables: number[];
}

export interface CaisseSupervision {
  id: number;
  restaurant: string | null;
  caissier: string;
  ouverture: string;
  cloture: string | null;
  fondDeCaisse: number;
  encaisseEspeces: number;
  encaisseMobileMoney: number;
  montantTheorique: number;
  montantCompte: number | null;
  ecart: number | null;
}

export interface StockSupervision {
  ingredientId: number;
  restaurant: string;
  ingredient: string;
  unite: Unite;
  stock: number;
  seuilAlerte: number;
  niveauCible: number;
  alerte: boolean;
  aReapprovisionner: number;
}

/** Espace d'administration : supervision de tous les restaurants, en lecture. */
@Injectable({ providedIn: 'root' })
export class SupervisionService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/admin/supervision';

  tableauDeBord(debut: string, fin: string): Observable<TableauDeBord> {
    return this.http.get<TableauDeBord>(`${this.base}/tableau-de-bord`, { params: { debut, fin } });
  }

  commandes(debut: string, fin: string): Observable<CommandeSupervision[]> {
    return this.http.get<CommandeSupervision[]>(`${this.base}/commandes`, { params: { debut, fin } });
  }

  reservations(debut: string, fin: string): Observable<ReservationSupervision[]> {
    return this.http.get<ReservationSupervision[]>(`${this.base}/reservations`, { params: { debut, fin } });
  }

  caisses(): Observable<CaisseSupervision[]> {
    return this.http.get<CaisseSupervision[]>(`${this.base}/caisses`);
  }

  stocks(): Observable<StockSupervision[]> {
    return this.http.get<StockSupervision[]>(`${this.base}/stocks`);
  }
}

/** Date du jour - n jours, au format AAAA-MM-JJ (heure locale). */
export function ilYA(jours: number): string {
  const d = new Date();
  d.setDate(d.getDate() - jours);
  const mois = String(d.getMonth() + 1).padStart(2, '0');
  const jour = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mois}-${jour}`;
}

export const LIBELLES_ROLES: Record<Role, string> = {
  CLIENT: 'Clients',
  SERVEUR: 'Serveurs',
  CUISINIER: 'Cuisiniers',
  CAISSIER: 'Caissiers',
  GERANT: 'Gérants',
  ADMINISTRATEUR: 'Administrateurs',
};

export const LIBELLES_MODES: Record<ModePaiement, string> = {
  ESPECES: 'Espèces',
  MOBILE_MONEY: 'Mobile Money',
};
