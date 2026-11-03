import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ActionAvecVersionRequest, CommandeDto, PasserCommandeRequest } from './models';

/** Passer une commande, Suivre sa commande, Annuler sa commande (cahier des charges §4.3). */
@Injectable({ providedIn: 'root' })
export class CommandeClientService {
  private readonly http = inject(HttpClient);

  suivreCommandes(): Observable<CommandeDto[]> {
    return this.http.get<CommandeDto[]>('/api/commandes');
  }

  passerCommande(request: PasserCommandeRequest): Observable<CommandeDto> {
    return this.http.post<CommandeDto>('/api/commandes', request);
  }

  annuler(id: number, request: ActionAvecVersionRequest): Observable<CommandeDto> {
    return this.http.put<CommandeDto>(`/api/commandes/${id}/annuler`, request);
  }
}
