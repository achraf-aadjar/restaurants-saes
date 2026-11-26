import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  /** Action proposee a cote du message (ex. « Voir le panier »). */
  action?: { libelle: string; executer: () => void };
}

/** Petit message qui apparait en bas de l'ecran puis disparait seul. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly courant = signal<Toast | null>(null);
  private compteur = 0;
  private minuterie: ReturnType<typeof setTimeout> | undefined;

  afficher(message: string, action?: Toast['action'], dureeMs = 3500): void {
    clearTimeout(this.minuterie);
    this.courant.set({ id: ++this.compteur, message, action });
    this.minuterie = setTimeout(() => this.fermer(), dureeMs);
  }

  fermer(): void {
    clearTimeout(this.minuterie);
    this.courant.set(null);
  }
}
