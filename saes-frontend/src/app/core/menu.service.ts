import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';

import { MenuDto, RestaurantSummary } from './models';

/**
 * Consulter les menus (cahier des charges §4.2) : accessible sans compte.
 */
@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly http = inject(HttpClient);

  /** Restaurant consulte dans la page Menus ; le pied de page client l'affiche. */
  readonly restaurantConsulte = signal<RestaurantSummary | null>(null);

  restaurants(): Observable<RestaurantSummary[]> {
    return this.http.get<RestaurantSummary[]>('/api/public/restaurants');
  }

  menusEnVigueur(restaurantId: number): Observable<MenuDto[]> {
    return this.http.get<MenuDto[]>(`/api/public/restaurants/${restaurantId}/menus`);
  }
}
