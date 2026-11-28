import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { IngredientDto, IngredientSaveRequest, MouvementStockRequest } from './models';

/** Gerer les stocks (cahier des charges §4.6), cote gerant. */
@Injectable({ providedIn: 'root' })
export class GerantStockService {
  private readonly http = inject(HttpClient);

  /**
   * Sans restaurant : ceux du gerant. Avec : la supervision de l'administrateur,
   * qui est en lecture seule (la route admin s'appelle « stocks »).
   */
  lister(restaurantId?: number | null): Observable<IngredientDto[]> {
    return this.http.get<IngredientDto[]>(
      restaurantId == null
        ? '/api/gerant/ingredients'
        : `/api/admin/restaurants/${restaurantId}/stocks`,
    );
  }

  creer(request: IngredientSaveRequest): Observable<IngredientDto> {
    return this.http.post<IngredientDto>('/api/gerant/ingredients', request);
  }

  modifier(id: number, request: IngredientSaveRequest): Observable<IngredientDto> {
    return this.http.put<IngredientDto>(`/api/gerant/ingredients/${id}`, request);
  }

  enregistrerMouvement(id: number, request: MouvementStockRequest): Observable<IngredientDto> {
    return this.http.post<IngredientDto>(`/api/gerant/ingredients/${id}/mouvements`, request);
  }
}
