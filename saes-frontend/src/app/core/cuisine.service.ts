import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ActionAvecVersionRequest, CommandeDto } from './models';

/** Gerer la preparation des commandes (cahier des charges §4.3), cote cuisinier. */
@Injectable({ providedIn: 'root' })
export class CuisineService {
  private readonly http = inject(HttpClient);

  commandesAPreparer(): Observable<CommandeDto[]> {
    return this.http.get<CommandeDto[]>('/api/cuisine/commandes');
  }

  demarrer(id: number, request: ActionAvecVersionRequest): Observable<CommandeDto> {
    return this.http.put<CommandeDto>(`/api/cuisine/commandes/${id}/demarrer`, request);
  }

  terminer(id: number, request: ActionAvecVersionRequest): Observable<CommandeDto> {
    return this.http.put<CommandeDto>(`/api/cuisine/commandes/${id}/terminer`, request);
  }
}
