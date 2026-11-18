import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';

import { motifErreur } from '../../core/erreur.util';
import { GerantReservationService } from '../../core/gerant-reservation.service';
import { ReservationGerantDto } from '../../core/models';

/**
 * Reservations a venir du restaurant, reservees au gerant : il voit quelles
 * tables sont retenues et par qui, pour preparer la salle ou prevenir un client.
 */
@Component({
  selector: 'app-gerant-reservations',
  imports: [DatePipe],
  templateUrl: './reservations.html',
})
export class GerantReservations {
  private readonly gerantReservationService = inject(GerantReservationService);

  protected readonly reservations = signal<ReservationGerantDto[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);

  constructor() {
    this.gerantReservationService.aVenir().subscribe({
      next: (reservations) => {
        this.reservations.set(reservations);
        this.chargement.set(false);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de charger les réservations'));
      },
    });
  }

  protected numeros(reservation: ReservationGerantDto): string {
    return reservation.tables.map((t) => `n° ${t.numero}`).join(', ');
  }
}
