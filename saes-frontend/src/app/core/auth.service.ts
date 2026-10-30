import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import {
  AuthResponse,
  CompteUpdateRequest,
  InscriptionRequest,
  LoginRequest,
  Role,
  Utilisateur,
} from './models';

const TOKEN_KEY = 'saes_token';
const USER_KEY = 'saes_user';

/**
 * S'inscrire, S'authentifier, Gerer son compte (cahier des charges §4.1).
 * Le jeton JWT et l'utilisateur courant sont gardes en memoire (signal) et
 * persistes en localStorage pour survivre a un rechargement de page.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly userSignal = signal<Utilisateur | null>(this.lireUtilisateurStocke());

  readonly utilisateur = this.userSignal.asReadonly();
  readonly estConnecte = computed(() => this.userSignal() !== null);

  aLeRole(role: Role): boolean {
    return this.userSignal()?.roles.includes(role) ?? false;
  }

  inscrire(request: InscriptionRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('/api/auth/register', request)
      .pipe(tap((reponse) => this.enregistrerSession(reponse)));
  }

  authentifier(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('/api/auth/login', request)
      .pipe(tap((reponse) => this.enregistrerSession(reponse)));
  }

  modifierCompte(request: CompteUpdateRequest): Observable<Utilisateur> {
    return this.http
      .put<Utilisateur>('/api/me', request)
      .pipe(tap((utilisateur) => this.mettreAJourUtilisateur(utilisateur)));
  }

  supprimerCompte(): Observable<void> {
    return this.http.delete<void>('/api/me').pipe(tap(() => this.deconnecter()));
  }

  deconnecter(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.userSignal.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private enregistrerSession(reponse: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, reponse.token);
    localStorage.setItem(USER_KEY, JSON.stringify(reponse.utilisateur));
    this.userSignal.set(reponse.utilisateur);
  }

  private mettreAJourUtilisateur(utilisateur: Utilisateur): void {
    localStorage.setItem(USER_KEY, JSON.stringify(utilisateur));
    this.userSignal.set(utilisateur);
  }

  private lireUtilisateurStocke(): Utilisateur | null {
    try {
      const brut = localStorage.getItem(USER_KEY);
      return brut ? (JSON.parse(brut) as Utilisateur) : null;
    } catch {
      return null;
    }
  }
}
