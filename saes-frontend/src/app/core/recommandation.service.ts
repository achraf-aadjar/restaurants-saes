import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { RecommandationDto } from './models';
import { adresseSupervisee } from './supervision';

/** Consulter les recommandations d'approvisionnement (cahier des charges §4.6), cote gerant. */
@Injectable({ providedIn: 'root' })
export class RecommandationService {
  private readonly http = inject(HttpClient);

  /** Sans restaurant : celui du gerant. Avec : la supervision de l'administrateur. */
  lister(restaurantId?: number | null): Observable<RecommandationDto[]> {
    return this.http.get<RecommandationDto[]>(adresseSupervisee('recommandations', restaurantId));
  }
}
