import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { IngredientDto, IngredientSaveRequest, MouvementStockRequest } from './models';

/** Gerer les stocks (cahier des charges §4.6), cote gerant. */
@Injectable({ providedIn: 'root' })
export class GerantStockService {
  private readonly http = inject(HttpClient);

  lister(): Observable<IngredientDto[]> {
    return this.http.get<IngredientDto[]>('/api/gerant/ingredients');
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
