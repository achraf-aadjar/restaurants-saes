import { Component } from '@angular/core';

/**
 * Panneau de marque de la connexion et de l'inscription : le logo, une phrase,
 * trois raisons de creer un compte (toutes issues du cahier des charges : menus,
 * commande a emporter, reservation) et une photo de la salle.
 *
 * La photo est posee dans un cadre de sa taille, jamais etiree en fond : la
 * source fait 1280 px de large et le cadre affiche environ 520 px CSS, soit
 * 1040 px sur un ecran Retina, ce qui reste net.
 */
@Component({
  selector: 'app-auth-panneau',
  template: `
    <img
      class="logo-panneau"
      src="assets/logo/logo_une_couleur.svg"
      alt="Restaurants du SAES"
      width="150"
      height="48"
    />
    <div class="texte">
      <h2>Le restaurant du SAES, à portée de clic.</h2>
      <ul>
        <li>Consultez le menu du jour</li>
        <li>Commandez à emporter</li>
        <li>Réservez votre table</li>
      </ul>
    </div>
    <img
      class="photo-panneau"
      src="assets/site/salle-panoramique-400.webp"
      srcset="
        assets/site/salle-panoramique-400.webp   400w,
        assets/site/salle-panoramique-1280.webp 1280w
      "
      sizes="(min-width: 60rem) 32rem, 0px"
      width="1280"
      height="960"
      alt=""
    />
  `,
  styles: `
    :host {
      display: none;
    }

    @media (min-width: 60rem) {
      :host {
        display: flex;
        flex-direction: column;
        gap: clamp(0.9rem, 2.4vh, 1.75rem);
        padding: clamp(1.25rem, 3.4vh, 2.5rem) clamp(1.5rem, 3vw, 2.75rem);
        background: #080f19;
        color: #f5f2ea;
        --saes-vert: #f5f2ea;
      }
    }

    .logo-panneau {
      display: block;
      width: 9.5rem;
      height: auto;
      filter: brightness(0) invert(1);
    }

    h2 {
      margin: 0 0 clamp(0.6rem, 1.8vh, 1.25rem);
      color: #f5f2ea;
      font-size: clamp(1.5rem, 4.2vh, 2.4rem);
      font-weight: 600;
      line-height: 1.15;
    }

    ul {
      display: flex;
      flex-direction: column;
      gap: 0.7rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      color: #c3cbd6;
      font-weight: 600;
    }

    li::before {
      content: '';
      flex: none;
      width: 1.25rem;
      height: 1.25rem;
      border-radius: 50%;
      background:
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2308121c' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m5 12.5 4.5 4.5L19 7.5'/%3E%3C/svg%3E")
          center / 70% no-repeat,
        #76b947;
    }

    /* La photo prend la place qui reste dans la hauteur de la carte : elle ne
       l'allonge jamais. */
    .photo-panneau {
      display: block;
      flex: 1 1 0;
      width: 100%;
      min-height: 5rem;
      height: 0;
      object-fit: cover;
      border-radius: 1rem;
      box-shadow: 0 14px 36px rgb(0 0 0 / 50%);
    }
  `,
})
export class AuthPanneau {}
