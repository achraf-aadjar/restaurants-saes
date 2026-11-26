import { Component, inject } from '@angular/core';

import { ToastService } from '../../core/toast.service';

/**
 * Le message du ToastService. La zone reste dans la page (role « status ») pour
 * que les lecteurs d'ecran annoncent chaque message ; elle est posee au-dessus
 * de la barre de total des ecrans du personnel.
 */
@Component({
  selector: 'app-toast',
  template: `
    <div class="zone" role="status" aria-live="polite">
      @if (toast.courant(); as t) {
        @for (m of [t.id]; track m) {
          <div class="toast">
            <svg class="coche" viewBox="0 0 24 24" aria-hidden="true">
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
            <span class="texte">{{ t.message }}</span>
            @if (t.action; as a) {
              <button type="button" class="action" (click)="a.executer(); toast.fermer()">
                {{ a.libelle }}
              </button>
            }
          </div>
        }
      }
    </div>
  `,
  styles: `
    .zone {
      position: fixed;
      inset-inline: 0;
      bottom: 1rem;
      z-index: 80;
      display: flex;
      justify-content: center;
      padding-inline: var(--saes-gouttiere);
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      max-width: 30rem;
      padding: 0.7rem 0.9rem;
      border-radius: 0.9rem;
      background: #08312d;
      color: #fcfbf7;
      box-shadow: 0 10px 30px rgb(0 0 0 / 28%);
      font-weight: 600;
      pointer-events: auto;
      animation: saes-toast 0.28s cubic-bezier(0.2, 0.8, 0.3, 1.2);
    }

    .coche {
      flex: none;
      width: 1.5rem;
      height: 1.5rem;
      padding: 0.25rem;
      border-radius: 50%;
      background: #2f9e5c;
      fill: none;
      stroke: #fff;
      stroke-width: 3;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .texte {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    .action {
      flex: none;
      min-height: 2rem;
      padding: 0.2rem 0.7rem;
      border: 1.5px solid #fec608;
      border-radius: 999px;
      background: transparent;
      color: #fec608;
      font: inherit;
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
    }

    .action:hover {
      background: #fec608;
      color: #08312d;
    }

    @keyframes saes-toast {
      from {
        opacity: 0;
        transform: translateY(1rem) scale(0.96);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .toast {
        animation: none;
      }
    }
  `,
})
export class ToastZone {
  protected readonly toast = inject(ToastService);
}
