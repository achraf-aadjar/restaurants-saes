import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { RapportFinancierDto } from './models';
import { adresseSupervisee } from './supervision';

/** Consulter les rapports financiers (cahier des charges §4.5), cote gerant. */
@Injectable({ providedIn: 'root' })
export class GerantRapportService {
  private readonly http = inject(HttpClient);

  /** Sans restaurant : celui du gerant. Avec : la supervision de l'administrateur. */
  consulter(
    debut: string,
    fin: string,
    restaurantId?: number | null,
  ): Observable<RapportFinancierDto> {
    return this.http.get<RapportFinancierDto>(
      adresseSupervisee('rapports-financiers', restaurantId),
      { params: { debut, fin } },
    );
  }
}
