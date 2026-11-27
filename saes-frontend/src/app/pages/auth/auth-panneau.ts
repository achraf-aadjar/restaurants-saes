import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Panneau photo de la connexion et de l'inscription, a droite du formulaire : la
 * salle du restaurant en fond sous un voile sombre, le logo, un grand titre, une
 * phrase et une note. Aucun chiffre : seulement ce que le cahier des charges
 * promet (menus, commande a emporter, reservation, paiement a la caisse).
 *
 * La photo (1280 px de large) remplit un panneau d'environ 450 px de large sur
 * 560 de haut : elle est reduite pour couvrir la hauteur, jamais agrandie.
 */
@Component({
  selector: 'app-auth-panneau',
  imports: [RouterLink],
  template: `
    <img
      class="fond"
      src="assets/site/salle-panoramique-400.webp"
      srcset="
        assets/site/salle-panoramique-400.webp   400w,
        assets/site/salle-panoramique-1280.webp 1280w
      "
      sizes="(min-width: 60rem) 40rem, 0px"
      width="1280"
      height="960"
      alt=""
    />
    <div class="voile"></div>

    <div class="corps-panneau">
      <a routerLink="/" class="marque" aria-label="Restaurants du SAES, accueil">
        <img
          src="assets/logo/logo_une_couleur.svg"
          alt=""
          width="150"
          height="48"
          class="logo-panneau"
        />
      </a>

      <div class="texte">
        <h2>Le restaurant du SAES, à portée de clic.</h2>
        <p>
          Consultez le menu du jour, commandez à emporter et réservez votre table, au restaurant de
          l'École polytechnique de Thiès.
        </p>
      </div>

      <p class="note">
        <span class="icone-note" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <circle cx="12" cy="12" r="2.5" />
            <path d="M6 12h.01M18 12h.01" />
          </svg>
        </span>
        Une commande en ligne se règle à la caisse, au retrait, en espèces ou par Mobile Money.
      </p>
    </div>
  `,
  styles: `
    :host {
      display: none;
    }

    @media (min-width: 60rem) {
      :host {
        position: relative;
        display: block;
        overflow: hidden;
        background: #080f19;
        color: #f5f2ea;
      }
    }

    .fond {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: 55% center;
    }

    /* Voile : la photo reste lisible en haut, tres sombre en bas ou se trouve le texte. */
    .voile {
      position: absolute;
      inset: 0;
      background:
        linear-gradient(
          0deg,
          rgb(8 15 25 / 94%) 0%,
          rgb(8 15 25 / 70%) 45%,
          rgb(8 15 25 / 30%) 100%
        ),
        linear-gradient(90deg, rgb(8 15 25 / 35%), transparent 60%);
    }

    .corps-panneau {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: clamp(0.9rem, 2.4vh, 1.75rem);
      height: 100%;
      padding: clamp(1.25rem, 3.4vh, 2.5rem) clamp(1.5rem, 3vw, 2.5rem);
    }

    .marque {
      display: inline-block;
      align-self: flex-start;
    }

    .logo-panneau {
      display: block;
      width: 9.5rem;
      height: auto;
      filter: brightness(0) invert(1);
    }

    .texte {
      margin-top: auto;
    }

    h2 {
      margin: 0 0 clamp(0.5rem, 1.6vh, 1rem);
      color: #f5f2ea;
      font-size: clamp(1.6rem, 4.6vh, 2.6rem);
      font-weight: 600;
      line-height: 1.12;
      letter-spacing: -0.02em;
    }

    .texte p {
      max-width: 30rem;
      margin: 0;
      color: #d6dce5;
      font-size: clamp(0.9rem, 2vh, 1.05rem);
      line-height: 1.6;
    }

    .note {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      margin: 0;
      padding: 0.8rem 1rem;
      border: 1px solid rgb(255 255 255 / 16%);
      border-radius: 1rem;
      background: rgb(255 255 255 / 10%);
      backdrop-filter: blur(8px);
      color: #e6ebf2;
      font-size: 0.9rem;
      line-height: 1.45;
    }

    .icone-note {
      display: grid;
      flex: none;
      place-items: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 0.75rem;
      background: rgb(255 255 255 / 14%);
    }

    .icone-note svg {
      width: 1.3rem;
      height: 1.3rem;
      fill: none;
      stroke: #f5f2ea;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `,
})
export class AuthPanneau {}
