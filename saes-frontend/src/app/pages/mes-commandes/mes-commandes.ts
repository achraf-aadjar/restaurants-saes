import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

import { CommandeClientService } from '../../core/commande-client.service';
import { classeBadgeStatut, LIBELLES_STATUT_COMMANDE } from '../../core/commande.util';
import { motifErreur } from '../../core/erreur.util';
import { CommandeDto, StatutCommande } from '../../core/models';
import { FocusAuRendu } from '../../shared/focus-au-rendu';
import { MontantPipe } from '../../shared/montant.pipe';
import { RefusVisible } from '../../shared/refus-visible';

/** Commandes que la cuisine ou la caisse n'ont pas encore terminées. */
const STATUTS_EN_COURS: StatutCommande[] = ['EN_ATTENTE', 'EN_PREPARATION', 'PRETE'];
/** Commandes passées montrées d'un coup, puis à chaque « Voir les précédentes ». */
const PAR_PAGE = 10;

/**
 * Suivre sa commande, Annuler sa commande (cahier des charges §4.3). Les
 * commandes en cours d'abord, toutes ; puis les commandes passées, les plus
 * récentes, dix par dix : la page ne s'allonge pas avec l'historique.
 */
@Component({
  selector: 'app-mes-commandes',
  imports: [DatePipe, FocusAuRendu, MontantPipe, RefusVisible],
  templateUrl: './mes-commandes.html',
  styleUrl: './mes-commandes.scss',
})
export class MesCommandes {
  private readonly commandeClientService = inject(CommandeClientService);

  protected readonly libelles = LIBELLES_STATUT_COMMANDE;
  protected readonly classeBadge = classeBadgeStatut;

  protected readonly commandes = signal<CommandeDto[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly annulationEnCours = signal<number | null>(null);

  private readonly nombrePassees = signal(PAR_PAGE);

  /**
   * « En cours » puis « Passées », sans partie vide. `suivantes` : commandes
   * que « Voir les précédentes » ajouterait (au plus dix).
   */
  protected readonly parties = computed(() => {
    const enCours = this.commandes().filter((c) => STATUTS_EN_COURS.includes(c.statut));
    const passees = this.commandes().filter((c) => !STATUTS_EN_COURS.includes(c.statut));
    return [
      { titre: 'En cours', commandes: enCours, suivantes: 0 },
      {
        titre: 'Passées',
        commandes: passees.slice(0, this.nombrePassees()),
        suivantes: Math.min(PAR_PAGE, passees.length - this.nombrePassees()),
      },
    ].filter((partie) => partie.commandes.length > 0);
  });

  /** Carte dont l'action attend la confirmation : le statut obtenu est définitif (règle 1). */
  protected readonly aConfirmer = signal<number | null>(null);
  /** Carte où l'on vient de renoncer : son bouton reprend le focus du clavier. */
  protected readonly retourFocus = signal<number | null>(null);

  constructor() {
    this.charger();
  }

  private charger(): void {
    this.chargement.set(true);
    this.commandeClientService.suivreCommandes().subscribe({
      next: (commandes) => {
        this.commandes.set(commandes);
        this.chargement.set(false);
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(motifErreur(err, 'Impossible de charger vos commandes'));
      },
    });
  }

  protected voirPrecedentes(): void {
    this.nombrePassees.update((n) => n + PAR_PAGE);
  }

  protected annuler(commande: CommandeDto): void {
    this.erreur.set(null);
    this.annulationEnCours.set(commande.id);
    this.commandeClientService.annuler(commande.id, { version: commande.version }).subscribe({
      next: () => {
        this.annulationEnCours.set(null);
        this.aConfirmer.set(null);
        this.charger();
      },
      error: (err) => {
        this.annulationEnCours.set(null);
        this.aConfirmer.set(null);
        this.erreur.set(motifErreur(err, 'Annulation impossible'));
        this.charger();
      },
    });
  }

  protected garder(id: number): void {
    this.aConfirmer.set(null);
    this.retourFocus.set(id);
  }
}
