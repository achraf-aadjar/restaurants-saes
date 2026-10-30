import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { CreateStaffRequest, Role, Utilisateur } from './models';

/**
 * Gerer les comptes utilisateurs (cahier des charges §4.7), reserve a
 * l'administrateur.
 */
@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly http = inject(HttpClient);

  lister(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>('/api/admin/users');
  }

  creerPersonnel(request: CreateStaffRequest): Observable<Utilisateur> {
    return this.http.post<Utilisateur>('/api/admin/users', request);
  }

  modifierRoles(id: number, roles: Role[]): Observable<Utilisateur> {
    return this.http.put<Utilisateur>(`/api/admin/users/${id}/roles`, { roles });
  }

  activer(id: number): Observable<Utilisateur> {
    return this.http.put<Utilisateur>(`/api/admin/users/${id}/activer`, {});
  }

  desactiver(id: number): Observable<Utilisateur> {
    return this.http.put<Utilisateur>(`/api/admin/users/${id}/desactiver`, {});
  }
}
