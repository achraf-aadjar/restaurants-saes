import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

/** Operations du domaine de l'administrateur : comptes et restaurants. */
export type ActionJournal =
  | 'COMPTE_CREE'
  | 'ROLES_MODIFIES'
  | 'COMPTE_ACTIVE'
  | 'COMPTE_DESACTIVE'
  | 'RESTAURANT_CREE'
  | 'RESTAURANT_MODIFIE'
  | 'RESTAURANT_ACTIVE'
  | 'RESTAURANT_DESACTIVE';

export interface JournalOperation {
  id: number;
  dateHeure: string;
  acteurId: number | null;
  acteur: string | null;
  action: ActionJournal;
  objetType: string;
  objetId: number | null;
  details: string | null;
}

export const LIBELLES_ACTIONS: Record<ActionJournal, string> = {
  COMPTE_CREE: 'Compte créé',
  ROLES_MODIFIES: 'Rôles modifiés',
  COMPTE_ACTIVE: 'Compte réactivé',
  COMPTE_DESACTIVE: 'Compte désactivé',
  RESTAURANT_CREE: 'Restaurant créé',
  RESTAURANT_MODIFIE: 'Restaurant modifié',
  RESTAURANT_ACTIVE: 'Restaurant réactivé',
  RESTAURANT_DESACTIVE: 'Restaurant désactivé',
};

/** Historique des operations d'administration (comptes et restaurants). */
@Injectable({ providedIn: 'root' })
export class JournalService {
  private readonly http = inject(HttpClient);

  plusRecentes(nombre = 200): Observable<JournalOperation[]> {
    return this.http.get<JournalOperation[]>('/api/admin/journal', { params: { nombre } });
  }
}
