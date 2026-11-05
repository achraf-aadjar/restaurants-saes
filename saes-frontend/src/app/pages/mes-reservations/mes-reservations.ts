import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { motifErreur } from '../../core/erreur.util';
import { MenuService } from '../../core/menu.service';
import { ReservationDto, RestaurantSummary } from '../../core/models';
import { ReservationService } from '../../core/reservation.service';
import { RefusVisible } from '../../shared/refus-visible';

/** Faire une reservation, Gerer ses reservations (cahier des charges §4.4). */
@Component({
  selector: 'app-mes-reservations',
  imports: [FormsModule, DatePipe, RefusVisible],
  templateUrl: './mes-reservations.html',
})
export class MesReservations {
  private readonly reservationService = inject(ReservationService);
  private readonly menuService = inject(MenuService);

  protected readonly restaurants = signal<RestaurantSummary[]>([]);
  protected readonly reservations = signal<ReservationDto[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);

  protected readonly formulaireOuvert = signal(false);
  protected readonly erreurFormulaire = signal<string | null>(null);
  protected readonly envoiEnCours = signal(false);
  protected readonly annulationEnCours = signal<number | null>(null);

  protected restaurantId: number | null = null;
  protected date = '';
  protected heure = '';
  protected nombreCouverts = 2;
  // Grise les jours passes dans le calendrier
  protected readonly aujourdhui = new Date().toISOString().slice(0, 10);

  constructor() {
    // Arrivee par le bouton « Reserver » du bandeau des menus : le formulaire
    // s'ouvre directement, sur le restaurant consulte.
    const depuisLeBandeau = Number(inject(ActivatedRoute).snapshot.queryParamMap.get('restaurant'));
    if (depuisLeBandeau) {
      this.restaurantId = depuisLeBandeau;
      this.formulaireOuvert.set(true);
    }
    this.menuService.restaurants().subscribe((r) => {
      this.restaurants.set(r);
      if (r.length > 0 && this.restaurantId === null) {
        this.restaurantId = r[0].id;
      }
    });
    this.charger();
  }

  private charger(): void {
    this.chargement.set(true);
    this.reservationService.mesReservations().subscribe({
      next: (reservations) => {
        this.reservations.set(reservations);
        this.chargement.set(false);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de charger vos réservations'));
      },
    });
  }

  protected reserver(): void {
    this.erreurFormulaire.set(null);
    if (!this.restaurantId || !this.date || !this.heure) {
      this.erreurFormulaire.set("Merci de renseigner le restaurant, la date et l'heure");
      return;
    }
    // Le calendrier grise les jours passes, pas les heures : on verifie les deux ici
    if (new Date(`${this.date}T${this.heure}`) <= new Date()) {
      this.erreurFormulaire.set('Choisissez une date et une heure à venir');
      return;
    }
    this.envoiEnCours.set(true);
    this.reservationService
      .faireReservation({
        restaurantId: this.restaurantId,
        dateHeure: `${this.date}T${this.heure}:00`,
        nombreCouverts: this.nombreCouverts,
      })
      .subscribe({
        next: () => {
          this.envoiEnCours.set(false);
          this.formulaireOuvert.set(false);
          this.charger();
        },
        error: (err) => {
          this.envoiEnCours.set(false);
          this.erreurFormulaire.set(motifErreur(err, 'Réservation impossible'));
        },
      });
  }

  protected annuler(reservation: ReservationDto): void {
    this.erreur.set(null);
    this.annulationEnCours.set(reservation.id);
    this.reservationService.annuler(reservation.id).subscribe({
      next: () => {
        this.annulationEnCours.set(null);
        this.charger();
      },
      error: (err) => {
        this.annulationEnCours.set(null);
        this.erreur.set(motifErreur(err, 'Annulation impossible'));
      },
    });
  }
}
