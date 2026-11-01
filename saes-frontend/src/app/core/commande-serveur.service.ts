import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  ActionAvecVersionRequest,
  CommandeDto,
  ModifierCommandeRequest,
  OccupationRestaurantDto,
  PrendreCommandeRequest,
} from './models';

/**
 * Prendre une commande, Modifier ou annuler une commande, Visualiser
 * l'occupation des tables (cahier des charges §4.3), cote serveur.
 */
@Injectable({ providedIn: 'root' })
export class CommandeServeurService {
  private readonly http = inject(HttpClient);

  commandesEnAttente(): Observable<CommandeDto[]> {
    return this.http.get<CommandeDto[]>('/api/serveur/commandes');
  }

  prendreCommande(request: PrendreCommandeRequest): Observable<CommandeDto> {
    return this.http.post<CommandeDto>('/api/serveur/commandes', request);
  }

  modifierCommande(id: number, request: ModifierCommandeRequest): Observable<CommandeDto> {
    return this.http.put<CommandeDto>(`/api/serveur/commandes/${id}`, request);
  }

  annulerCommande(id: number, request: ActionAvecVersionRequest): Observable<CommandeDto> {
    return this.http.put<CommandeDto>(`/api/serveur/commandes/${id}/annuler`, request);
  }

  occupationTables(): Observable<OccupationRestaurantDto> {
    return this.http.get<OccupationRestaurantDto>('/api/serveur/occupation-tables');
  }
}
