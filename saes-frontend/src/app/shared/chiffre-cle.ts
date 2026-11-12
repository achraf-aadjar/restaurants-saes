import { Component, input } from '@angular/core';

/**
 * Un chiffre clé d'un rapport : une pastille à icône, un grand nombre et sa
 * légende (écran de référence 5). La taille du nombre suit la largeur de la carte.
 */
@Component({
  selector: 'app-chiffre-cle',
  templateUrl: './chiffre-cle.html',
  styleUrl: './chiffre-cle.scss',
})
export class ChiffreCle {
  /** Tracé de l'icône (24 × 24, au trait). */
  readonly icone = input.required<string>();
  readonly nombre = input.required<string | number>();
  readonly libelle = input.required<string>();
}
