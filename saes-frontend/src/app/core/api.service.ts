import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface Ping {
  service: string;
  status: string;
  timestamp: string;
}

/**
 * Appels vers saes-backend. Les URLs sont relatives : le proxy du serveur
 * de dev (proxy.conf.json) redirige /api vers http://localhost:8080.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  ping(): Observable<Ping> {
    return this.http.get<Ping>('/api/ping');
  }
}
