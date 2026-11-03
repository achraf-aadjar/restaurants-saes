import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { IngredientDto } from './models';

/** Signaler une rupture (cahier des charges §4.6), cote cuisinier. */
@Injectable({ providedIn: 'root' })
export class RuptureService {
  private readonly http = inject(HttpClient);

  listerIngredients(): Observable<IngredientDto[]> {
    return this.http.get<IngredientDto[]>('/api/cuisine/ingredients');
  }

  signaler(id: number): Observable<void> {
    return this.http.post<void>(`/api/cuisine/ingredients/${id}/signaler-rupture`, {});
  }
}
