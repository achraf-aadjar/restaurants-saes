import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';

/** Minutes ecoulees au-dela desquelles l'attente est signalee, puis soulignee. */
const SEUIL_ATTENTION = 20;
const SEUIL_URGENCE = 35;

/**
 * Temps ecoule depuis l'arrivee d'une commande, pour les ecrans de la cuisine
 * et de la salle. Il se met a jour tout seul, sans recharger la page.
 *
 * Ce n'est qu'un reperage visuel : il ne change ni le statut de la commande ni
 * son ordre de preparation, qui restent ceux du cahier des charges.
 */
@Component({
  selector: 'app-temps-ecoule',
  template: `
    <span class="temps" [class]="niveau()">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
      <span>{{ libelle() }}</span>
    </span>
  `,
  styles: `
    .temps {
      display: inline-flex;
      align-items: center;
      gap: 0.35em;
      padding: 0.2em 0.6em;
      border-radius: 999px;
      background: var(--saes-neutre-fond);
      color: var(--saes-neutre-texte);
      font-size: 0.85rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .attention {
      background: var(--saes-attente-fond);
      color: var(--saes-attente-texte);
    }

    .urgence {
      background: var(--saes-refus-fond);
      color: var(--saes-refus-texte);
    }

    svg {
      width: 1.05em;
      height: 1.05em;
      fill: none;
      stroke: currentColor;
      stroke-width: 2.2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `,
})
export class TempsEcoule {
  /** Date d'arrivee, au format ISO renvoye par l'API. */
  readonly depuis = input.required<string>();

  private readonly maintenant = signal(Date.now());

  protected readonly minutes = computed(() => {
    const debut = new Date(this.depuis()).getTime();
    return Math.max(0, Math.floor((this.maintenant() - debut) / 60000));
  });

  protected readonly libelle = computed(() => {
    const m = this.minutes();
    if (m < 60) return `${m} min`;
    const heures = Math.floor(m / 60);
    const reste = m % 60;
    return reste === 0 ? `${heures} h` : `${heures} h ${String(reste).padStart(2, '0')}`;
  });

  protected readonly niveau = computed(() => {
    const m = this.minutes();
    if (m >= SEUIL_URGENCE) return 'urgence';
    if (m >= SEUIL_ATTENTION) return 'attention';
    return '';
  });

  constructor() {
    const minuterie = setInterval(() => this.maintenant.set(Date.now()), 30_000);
    inject(DestroyRef).onDestroy(() => clearInterval(minuterie));
  }
}
