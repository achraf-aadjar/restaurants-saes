import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { StatistiquesVentesDto } from './models';

/** Consulter les statistiques de ventes (cahier des charges §4.6), cote gerant. */
@Injectable({ providedIn: 'root' })
export class GerantStatistiquesService {
  private readonly http = inject(HttpClient);

  consulter(debut: string, fin: string): Observable<StatistiquesVentesDto> {
    return this.http.get<StatistiquesVentesDto>('/api/gerant/statistiques-ventes', { params: { debut, fin } });
  }
}
