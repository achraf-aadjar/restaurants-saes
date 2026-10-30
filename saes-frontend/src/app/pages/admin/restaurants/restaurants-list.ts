import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminRestaurantService } from '../../../core/admin-restaurant.service';
import { motifErreur } from '../../../core/erreur.util';
import {
  HoraireDto,
  JOURS_SEMAINE,
  JourSemaine,
  RestaurantDto,
  RestaurantSaveRequest,
  TableDto,
} from '../../../core/models';

/**
 * Gerer les restaurants (cahier des charges §4.7), reserve a
 * l'administrateur : nom, adresse, telephone, duree de reservation, tables
 * (au moins une), horaires (au moins une plage dans la semaine).
 */
@Component({
  selector: 'app-restaurants-list',
  imports: [FormsModule],
  templateUrl: './restaurants-list.html',
})
export class RestaurantsList {
  private readonly adminRestaurantService = inject(AdminRestaurantService);

  protected readonly jours = JOURS_SEMAINE;
  protected readonly restaurants = signal<RestaurantDto[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly erreurFormulaire = signal<string | null>(null);
  protected readonly enregistrementEnCours = signal(false);
  protected readonly formulaireOuvert = signal(false);

  protected idEnEdition: number | null = null;
  protected nom = '';
  protected adresse = '';
  protected telephone = '';
  protected dureeReservationMinutes = 90;
  protected tables: TableDto[] = [];
  protected horaires: HoraireDto[] = [];

  constructor() {
    this.charger();
  }

  private charger(): void {
    this.chargement.set(true);
    this.adminRestaurantService.lister().subscribe({
      next: (restaurants) => {
        this.restaurants.set(restaurants);
        this.chargement.set(false);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de charger les restaurants'));
      },
    });
  }

  protected ouvrirCreation(): void {
    this.idEnEdition = null;
    this.nom = '';
    this.adresse = '';
    this.telephone = '';
    this.dureeReservationMinutes = 90;
    this.tables = [{ numero: 1, capacite: 2 }];
    this.horaires = [{ jour: 'LUNDI', heureOuverture: '08:00', heureFermeture: '21:00' }];
    this.erreurFormulaire.set(null);
    this.formulaireOuvert.set(true);
  }

  protected ouvrirEdition(restaurant: RestaurantDto): void {
    this.idEnEdition = restaurant.id;
    this.nom = restaurant.nom;
    this.adresse = restaurant.adresse;
    this.telephone = restaurant.telephone ?? '';
    this.dureeReservationMinutes = restaurant.dureeReservationMinutes;
    this.tables = restaurant.tables.map((t) => ({ ...t }));
    this.horaires = restaurant.horaires.map((h) => ({ ...h }));
    this.erreurFormulaire.set(null);
    this.formulaireOuvert.set(true);
  }

  protected ajouterTable(): void {
    const prochainNumero = this.tables.length
      ? Math.max(...this.tables.map((t) => t.numero)) + 1
      : 1;
    this.tables = [...this.tables, { numero: prochainNumero, capacite: 2 }];
  }

  protected retirerTable(index: number): void {
    this.tables = this.tables.filter((_, i) => i !== index);
  }

  protected ajouterHoraire(): void {
    this.horaires = [
      ...this.horaires,
      { jour: 'LUNDI' as JourSemaine, heureOuverture: '08:00', heureFermeture: '21:00' },
    ];
  }

  protected retirerHoraire(index: number): void {
    this.horaires = this.horaires.filter((_, i) => i !== index);
  }

  protected enregistrer(): void {
    this.erreurFormulaire.set(null);
    if (this.tables.length === 0) {
      this.erreurFormulaire.set('Au moins une table est requise');
      return;
    }
    if (this.horaires.length === 0) {
      this.erreurFormulaire.set('Au moins une plage d\'ouverture est requise dans la semaine');
      return;
    }

    const request: RestaurantSaveRequest = {
      nom: this.nom,
      adresse: this.adresse,
      telephone: this.telephone || undefined,
      dureeReservationMinutes: this.dureeReservationMinutes,
      tables: this.tables,
      horaires: this.horaires,
    };

    this.enregistrementEnCours.set(true);
    const appel = this.idEnEdition
      ? this.adminRestaurantService.modifier(this.idEnEdition, request)
      : this.adminRestaurantService.creer(request);

    appel.subscribe({
      next: () => {
        this.enregistrementEnCours.set(false);
        this.formulaireOuvert.set(false);
        this.charger();
      },
      error: (err) => {
        this.enregistrementEnCours.set(false);
        this.erreurFormulaire.set(motifErreur(err, 'Enregistrement impossible'));
      },
    });
  }

  protected changerActivation(restaurant: RestaurantDto): void {
    const action = restaurant.estActif
      ? this.adminRestaurantService.desactiver(restaurant.id)
      : this.adminRestaurantService.activer(restaurant.id);
    action.subscribe({
      next: () => this.charger(),
      error: (err) => this.erreur.set(motifErreur(err, 'Action impossible')),
    });
  }
}
