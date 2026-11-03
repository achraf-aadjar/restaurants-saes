import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { MenuGerantDto, MenuSaveRequest } from './models';

/** Gerer les menus (cahier des charges §4.2), cote gerant. */
@Injectable({ providedIn: 'root' })
export class GerantMenuService {
  private readonly http = inject(HttpClient);

  lister(): Observable<MenuGerantDto[]> {
    return this.http.get<MenuGerantDto[]>('/api/gerant/menus');
  }

  creer(request: MenuSaveRequest): Observable<MenuGerantDto> {
    return this.http.post<MenuGerantDto>('/api/gerant/menus', request);
  }

  modifier(id: number, request: MenuSaveRequest): Observable<MenuGerantDto> {
    return this.http.put<MenuGerantDto>(`/api/gerant/menus/${id}`, request);
  }
}
