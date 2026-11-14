import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { heureEnLettres } from '../../core/date.util';
import { RestaurantSummary } from '../../core/models';
import { photoDuRestaurant } from '../../core/photos-restaurants';

/**
 * Bandeau du restaurant en tete de la consultation des menus (ecran de reference 1) :
 * photo, nom, adresse, horaires du jour, pastille « Ouvert » et, pour le client,
 * le decor et « Reserver ».
 */
@Component({
  selector: 'app-bandeau-restaurant',
  imports: [RouterLink],
  templateUrl: './bandeau-restaurant.html',
  styleUrl: './bandeau-restaurant.scss',
})
export class BandeauRestaurant {
  readonly restaurant = input.required<RestaurantSummary>();
  /**
   * L'ecran de reference 1 est celui du client (et du visiteur) : bandeau
   * pleine largeur, decor et bouton « Reserver ». Le personnel, qui a deja son
   * bandeau et sa barre laterale, voit le bandeau dans un cadre.
   */
  readonly vueClient = input(false);

  protected readonly photo = computed(() => photoDuRestaurant(this.restaurant().nom));

  /**
   * Adresse en deux lignes : la ville et le pays (epingle), puis l'etablissement
   * (batiment), sans repeter la ville. Il faut au moins trois elements separes
   * par des virgules ; sinon, une seule ligne.
   */
  protected readonly adresse = computed(() => {
    const parties = (this.restaurant().adresse ?? '')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    return parties.length >= 3
      ? { lieu: parties.slice(-2).join(', '), etablissement: parties.slice(0, -2).join(', ') }
      : { lieu: parties.join(', '), etablissement: '' };
  });

  /**
   * « 11 h 30 – 15 h · 19 h – 21 h 30 », comme sur l'ecran de reference 1 ; vide
   * si ferme. Espaces insecables dans chaque plage : une ligne ne se coupe
   * qu'entre deux plages, jamais dans « 8 h – 21 h ».
   */
  protected readonly horairesDuJour = computed(() =>
    (this.restaurant().horairesDuJour ?? [])
      .map((h) =>
        `${heureEnLettres(h.heureOuverture)} – ${heureEnLettres(h.heureFermeture)}`.replace(
          / /g,
          ' ',
        ),
      )
      .join(' · '),
  );
}
