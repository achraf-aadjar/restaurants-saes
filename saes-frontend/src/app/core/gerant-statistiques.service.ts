import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { StatistiquesVentesDto } from './models';
import { adresseSupervisee } from './supervision';

/** Consulter les statistiques de ventes (cahier des charges §4.6), cote gerant. */
@Injectable({ providedIn: 'root' })
export class GerantStatistiquesService {
  private readonly http = inject(HttpClient);

  /** Sans restaurant : celui du gerant. Avec : la supervision de l'administrateur. */
  consulter(
    debut: string,
    fin: string,
    restaurantId?: number | null,
  ): Observable<StatistiquesVentesDto> {
    return this.http.get<StatistiquesVentesDto>(
      adresseSupervisee('statistiques-ventes', restaurantId),
      { params: { debut, fin } },
    );
  }
}
