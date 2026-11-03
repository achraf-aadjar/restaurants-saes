import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { CaisseService } from '../../core/caisse.service';
import { classeBadgeStatut, LIBELLES_STATUT_COMMANDE } from '../../core/commande.util';
import { motifErreur } from '../../core/erreur.util';
import { CommandeDto, ModePaiement, SessionCaisseDto } from '../../core/models';
import { MontantPipe } from '../../shared/montant.pipe';
import { MaCaisse } from './ma-caisse';

/** Encaisser une commande (cahier des charges §4.5), cote caissier. */
@Component({
  selector: 'app-encaisser-commande',
  imports: [FormsModule, RouterLink, MaCaisse, MontantPipe],
  templateUrl: './encaisser-commande.html',
})
export class EncaisserCommande {
  private readonly caisseService = inject(CaisseService);

  protected readonly libelles = LIBELLES_STATUT_COMMANDE;
  protected readonly classeBadge = classeBadgeStatut;

  protected readonly caisseOuverte = signal<SessionCaisseDto | null>(null);
  protected readonly commandes = signal<CommandeDto[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly actionEnCours = signal(false);

  protected modePaiementParCommande = new Map<number, ModePaiement>();
  protected readonly confirmationEncaissement = signal<number | null>(null);

  constructor() {
    this.caisseService.maSession().subscribe({
      next: (session) => {
        this.caisseOuverte.set(session && !session.dateHeureCloture ? session : null);
        this.chargement.set(false);
        if (this.caisseOuverte()) {
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
      error: (err) => this.erreur.set(motifErreur(err, 'Impossible de charger les commandes')),
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
      .encaisser(commande.id, {
        modePaiement: this.modePaiementDe(commande.id),
        version: commande.version,
      })
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
}
