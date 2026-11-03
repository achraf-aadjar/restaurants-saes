import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { RapportFinancierDto } from './models';

/** Consulter les rapports financiers (cahier des charges §4.5), cote gerant. */
@Injectable({ providedIn: 'root' })
export class GerantRapportService {
  private readonly http = inject(HttpClient);

  consulter(debut: string, fin: string): Observable<RapportFinancierDto> {
    return this.http.get<RapportFinancierDto>('/api/gerant/rapports-financiers', { params: { debut, fin } });
  }
}
