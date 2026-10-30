import { Component, inject, signal } from '@angular/core';
import { ApiService, Ping } from '../core/api.service';

@Component({
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home {
  private readonly api = inject(ApiService);

  protected readonly ping = signal<Ping | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);

  protected checkBackend(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.ping().subscribe({
      next: (ping) => {
        this.ping.set(ping);
        this.loading.set(false);
      },
      error: () => {
        this.ping.set(null);
        this.error.set('Backend injoignable. Lance saes-backend sur le port 8080.');
        this.loading.set(false);
      },
    });
  }
}
