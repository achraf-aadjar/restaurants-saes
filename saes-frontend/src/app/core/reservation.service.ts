import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { FaireReservationRequest, ReservationDto } from './models';

/** Faire une reservation, Gerer ses reservations (cahier des charges §4.4). */
@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly http = inject(HttpClient);

  mesReservations(): Observable<ReservationDto[]> {
    return this.http.get<ReservationDto[]>('/api/reservations');
  }

  faireReservation(request: FaireReservationRequest): Observable<ReservationDto> {
    return this.http.post<ReservationDto>('/api/reservations', request);
  }

  annuler(id: number): Observable<void> {
    return this.http.delete<void>(`/api/reservations/${id}`);
  }
}
