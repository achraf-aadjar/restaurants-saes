import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { PlatGerantDto, PlatSaveRequest } from './models';

/** Gerer les plats (cahier des charges §4.2), cote gerant. */
@Injectable({ providedIn: 'root' })
export class GerantPlatService {
  private readonly http = inject(HttpClient);

  lister(): Observable<PlatGerantDto[]> {
    return this.http.get<PlatGerantDto[]>('/api/gerant/plats');
  }

  creer(request: PlatSaveRequest): Observable<PlatGerantDto> {
    return this.http.post<PlatGerantDto>('/api/gerant/plats', request);
  }

  modifier(id: number, request: PlatSaveRequest): Observable<PlatGerantDto> {
    return this.http.put<PlatGerantDto>(`/api/gerant/plats/${id}`, request);
  }

  activer(id: number): Observable<PlatGerantDto> {
    return this.http.put<PlatGerantDto>(`/api/gerant/plats/${id}/activer`, {});
  }

  desactiver(id: number): Observable<PlatGerantDto> {
    return this.http.put<PlatGerantDto>(`/api/gerant/plats/${id}/desactiver`, {});
  }
}
