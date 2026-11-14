import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ReservationGerantDto } from './models';

/** Reservations a venir du restaurant du gerant. */
@Injectable({ providedIn: 'root' })
export class GerantReservationService {
  private readonly http = inject(HttpClient);

  aVenir(): Observable<ReservationGerantDto[]> {
    return this.http.get<ReservationGerantDto[]>('/api/gerant/reservations');
  }
}
