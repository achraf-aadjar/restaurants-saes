import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';

import { AuthService } from '../../core/auth.service';
import { accueilDe, estPersonnel, nomAffiche, sectionsDe } from '../../core/navigation';

/**
 * En-tete (organisation_travail_sujet17.pdf, Design) : le client a trois
 * onglets ; le personnel a un bandeau jaune avec son restaurant et la date.
 * Sur telephone, le nom et les fonctions passent sous le bouton menu.
 */
@Component({
  selector: 'app-header',
  imports: [DatePipe, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly menuOuvert = signal(false);
  protected readonly menuMobileOuvert = signal(false);
  protected readonly aujourdHui = new Date();

  /**
   * Page demandee avant la connexion (?retour=, mis par la garde) : les liens
   * Connexion et S'inscrire la gardent, pour que le visiteur y revienne.
   */
  protected readonly retour = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.routerState.snapshot.root.queryParamMap.get('retour') ?? undefined),
    ),
  );

  protected readonly sections = computed(() => sectionsDe(this.auth.utilisateur()));
  protected readonly accueil = computed(() => accueilDe(this.auth.utilisateur()));
  protected readonly nom = computed(() => {
    const utilisateur = this.auth.utilisateur();
    return utilisateur ? nomAffiche(utilisateur) : '';
  });

  /** Onglets du client, aussi montres au visiteur ; le personnel a sa barre laterale. */
  protected readonly ongletsClient = computed(() => {
    const utilisateur = this.auth.utilisateur();
    return !utilisateur || utilisateur.roles.includes('CLIENT');
  });

  /** Restaurant du bandeau jaune, pour le personnel seulement. */
  protected readonly restaurantDuBandeau = computed(() => {
    const utilisateur = this.auth.utilisateur();
    return estPersonnel(utilisateur) ? (utilisateur?.restaurantNom ?? null) : null;
  });

  protected basculerMenu(): void {
    this.menuOuvert.update((v) => !v);
  }

  protected basculerMenuMobile(): void {
    this.menuMobileOuvert.update((v) => !v);
  }

  protected seDeconnecter(): void {
    this.menuOuvert.set(false);
    this.menuMobileOuvert.set(false);
    this.auth.deconnecter();
    this.router.navigate(['/menus']);
  }
}
