import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ActionAvecVersionRequest, CommandeDto } from './models';

/** Declarer une commande abandonnee (cahier des charges §4.3), cote gerant. */
@Injectable({ providedIn: 'root' })
export class GerantCommandeService {
  private readonly http = inject(HttpClient);

  commandesAbandonnables(): Observable<CommandeDto[]> {
    return this.http.get<CommandeDto[]>('/api/gerant/commandes');
  }

  declarerAbandonnee(id: number, request: ActionAvecVersionRequest): Observable<CommandeDto> {
    return this.http.put<CommandeDto>(`/api/gerant/commandes/${id}/abandonner`, request);
  }
}
