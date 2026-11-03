import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  ClotureCaisseRequest,
  CommandeDto,
  EncaisserRequest,
  OuvrirCaisseRequest,
  SessionCaisseDto,
} from './models';

/** Ouvrir la caisse, Encaisser une commande, Cloturer la caisse (cahier des charges §4.5), cote caissier. */
@Injectable({ providedIn: 'root' })
export class CaisseService {
  private readonly http = inject(HttpClient);

  maSession(): Observable<SessionCaisseDto | null> {
    return this.http.get<SessionCaisseDto | null>('/api/caissier/caisse');
  }

  ouvrir(request: OuvrirCaisseRequest): Observable<SessionCaisseDto> {
    return this.http.post<SessionCaisseDto>('/api/caissier/caisse/ouvrir', request);
  }

  cloturer(request: ClotureCaisseRequest): Observable<SessionCaisseDto> {
    return this.http.put<SessionCaisseDto>('/api/caissier/caisse/cloturer', request);
  }

  commandesPretes(): Observable<CommandeDto[]> {
    return this.http.get<CommandeDto[]>('/api/caissier/commandes');
  }

  encaisser(id: number, request: EncaisserRequest): Observable<CommandeDto> {
    return this.http.put<CommandeDto>(`/api/caissier/commandes/${id}/encaisser`, request);
  }
}
