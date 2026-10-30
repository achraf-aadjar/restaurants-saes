import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { RestaurantDto, RestaurantSaveRequest } from './models';

/**
 * Gerer les restaurants (cahier des charges §4.7), reserve a
 * l'administrateur.
 */
@Injectable({ providedIn: 'root' })
export class AdminRestaurantService {
  private readonly http = inject(HttpClient);

  lister(): Observable<RestaurantDto[]> {
    return this.http.get<RestaurantDto[]>('/api/admin/restaurants');
  }

  consulter(id: number): Observable<RestaurantDto> {
    return this.http.get<RestaurantDto>(`/api/admin/restaurants/${id}`);
  }

  creer(request: RestaurantSaveRequest): Observable<RestaurantDto> {
    return this.http.post<RestaurantDto>('/api/admin/restaurants', request);
  }

  modifier(id: number, request: RestaurantSaveRequest): Observable<RestaurantDto> {
    return this.http.put<RestaurantDto>(`/api/admin/restaurants/${id}`, request);
  }

  activer(id: number): Observable<RestaurantDto> {
    return this.http.put<RestaurantDto>(`/api/admin/restaurants/${id}/activer`, {});
  }

  desactiver(id: number): Observable<RestaurantDto> {
    return this.http.put<RestaurantDto>(`/api/admin/restaurants/${id}/desactiver`, {});
  }
}
