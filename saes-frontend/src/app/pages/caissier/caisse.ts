import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CaisseService } from '../../core/caisse.service';
import { classeBadgeStatut, LIBELLES_STATUT_COMMANDE } from '../../core/commande.util';
import { motifErreur } from '../../core/erreur.util';
import { CommandeDto, ModePaiement, SessionCaisseDto } from '../../core/models';

/**
 * Ouvrir la caisse, Encaisser une commande, Cloturer la caisse (cahier des
 * charges §4.5), cote caissier.
 */
@Component({
  selector: 'app-caisse',
  imports: [FormsModule, DatePipe],
  templateUrl: './caisse.html',
})
export class Caisse {
  private readonly caisseService = inject(CaisseService);

  protected readonly libelles = LIBELLES_STATUT_COMMANDE;
  protected readonly classeBadge = classeBadgeStatut;

  protected readonly session = signal<SessionCaisseDto | null>(null);
  protected readonly commandes = signal<CommandeDto[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly actionEnCours = signal(false);

  protected fondDeCaisse = 10000;
  protected montantCompte = 0;
  protected modePaiementParCommande = new Map<number, ModePaiement>();
  protected readonly clotureOuverte = signal(false);
  protected readonly confirmationEncaissement = signal<number | null>(null);
  protected readonly resultatCloture = signal<SessionCaisseDto | null>(null);

  constructor() {
    this.charger();
  }

  private charger(): void {
    this.chargement.set(true);
    this.caisseService.maSession().subscribe({
      next: (session) => {
        this.session.set(session);
        this.chargement.set(false);
        if (session && !session.dateHeureCloture) {
          this.chargerCommandes();
        }
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de charger la caisse'));
      },
    });
  }

  private chargerCommandes(): void {
    this.caisseService.commandesPretes().subscribe({
      next: (commandes) => {
        this.commandes.set(commandes);
        for (const c of commandes) {
          if (!this.modePaiementParCommande.has(c.id)) {
            this.modePaiementParCommande.set(c.id, 'ESPECES');
          }
        }
      },
    });
  }

  protected ouvrir(): void {
    this.erreur.set(null);
    this.actionEnCours.set(true);
    this.caisseService.ouvrir({ fondDeCaisse: this.fondDeCaisse }).subscribe({
      next: () => {
        this.actionEnCours.set(false);
        this.resultatCloture.set(null);
        this.charger();
      },
      error: (err) => {
        this.actionEnCours.set(false);
        this.erreur.set(motifErreur(err, "Impossible d'ouvrir la caisse"));
      },
    });
  }

  protected modePaiementDe(commandeId: number): ModePaiement {
    return this.modePaiementParCommande.get(commandeId) ?? 'ESPECES';
  }

  protected changerModePaiement(commandeId: number, mode: ModePaiement): void {
    this.modePaiementParCommande.set(commandeId, mode);
  }

  protected encaisser(commande: CommandeDto): void {
    this.erreur.set(null);
    this.actionEnCours.set(true);
    this.caisseService
      .encaisser(commande.id, { modePaiement: this.modePaiementDe(commande.id), version: commande.version })
      .subscribe({
        next: () => {
          this.actionEnCours.set(false);
          this.confirmationEncaissement.set(null);
          this.chargerCommandes();
        },
        error: (err) => {
          this.actionEnCours.set(false);
          this.confirmationEncaissement.set(null);
          this.erreur.set(motifErreur(err, "Impossible d'encaisser la commande"));
          this.chargerCommandes();
        },
      });
  }

  protected cloturer(): void {
    this.erreur.set(null);
    this.actionEnCours.set(true);
    this.caisseService.cloturer({ montantCompte: this.montantCompte }).subscribe({
      next: (session) => {
        this.actionEnCours.set(false);
        this.clotureOuverte.set(false);
        this.resultatCloture.set(session);
        this.charger();
      },
      error: (err) => {
        this.actionEnCours.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de clôturer la caisse'));
      },
    });
  }
}
