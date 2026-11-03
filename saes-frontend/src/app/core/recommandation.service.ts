import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { RecommandationDto } from './models';

/** Consulter les recommandations d'approvisionnement (cahier des charges §4.6), cote gerant. */
@Injectable({ providedIn: 'root' })
export class RecommandationService {
  private readonly http = inject(HttpClient);

  lister(): Observable<RecommandationDto[]> {
    return this.http.get<RecommandationDto[]>('/api/gerant/recommandations');
  }
}
