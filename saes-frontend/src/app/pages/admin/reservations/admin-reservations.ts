import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { motifErreur } from '../../../core/erreur.util';
import { ReservationSupervision, SupervisionService, ilYA } from '../../../core/supervision.service';

/** Reservations de tous les restaurants, en lecture. */
@Component({
  selector: 'app-admin-reservations',
  imports: [DatePipe, FormsModule],
  templateUrl: './admin-reservations.html',
})
export class AdminReservations {
  private readonly supervision = inject(SupervisionService);

  protected debut = ilYA(0);
  protected fin = ilYA(-30);
  protected readonly reservations = signal<ReservationSupervision[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly confirmees = computed(() => this.reservations().filter((r) => r.statut === 'CONFIRMEE'));
  protected readonly couverts = computed(() => this.confirmees().reduce((a, r) => a + r.nombreCouverts, 0));

  constructor() {
    this.charger();
  }

  protected charger(): void {
    this.chargement.set(true);
    this.erreur.set(null);
    this.supervision.reservations(this.debut, this.fin).subscribe({
      next: (r) => {
        this.reservations.set(r);
        this.chargement.set(false);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de charger les réservations'));
      },
    });
  }
}
