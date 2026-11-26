import { DatePipe } from '@angular/common';
import {
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';

import { AuthService } from '../../core/auth.service';
import { accueilDe, estPersonnel, nomAffiche, sectionsDe } from '../../core/navigation';
import { PanierService } from '../../core/panier.service';
import { ThemeService } from '../../core/theme.service';

/**
 * En-tete (organisation_travail_sujet17.pdf, Design) : le client a trois
 * onglets ; le personnel a un bandeau avec son restaurant et la date.
 * Sur telephone, le nom et les fonctions passent sous le bouton menu. Les deux
 * menus se ferment par Echap (le focus revient a leur bouton), par un clic
 * ailleurs dans la page, ou par leur bouton.
 */
@Component({
  selector: 'app-header',
  imports: [DatePipe, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  host: {
    '(document:click)': 'clicAilleurs($event)',
    '(document:keydown.escape)': 'echap($event)',
  },
})
export class Header {
  protected readonly auth = inject(AuthService);
  protected readonly panier = inject(PanierService);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  protected readonly menuOuvert = signal(false);
  protected readonly menuMobileOuvert = signal(false);
  protected readonly aujourdHui = new Date();

  private readonly compte = viewChild<ElementRef<HTMLElement>>('compte');
  private readonly boutonCompte = viewChild<ElementRef<HTMLButtonElement>>('boutonCompte');
  private readonly burger = viewChild<ElementRef<HTMLButtonElement>>('burger');
  private readonly navMobile = viewChild<ElementRef<HTMLElement>>('navMobile');

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

  /** « Panier, 3 articles » : le nombre est lu avec le nom du bouton. */
  protected readonly nomBoutonPanier = computed(() => {
    const n = this.panier.nombreArticles();
    return n === 0 ? 'Panier' : `Panier, ${n} ${n > 1 ? 'articles' : 'article'}`;
  });

  /**
   * Message lu quand le nombre d'articles change (pas au chargement). Panier
   * ouvert, l'en-tete est inerte : c'est le panneau qui l'annonce.
   */
  protected readonly annoncePanier = signal('');

  /** Restaurant du bandeau, pour le personnel seulement. */
  protected readonly restaurantDuBandeau = computed(() => {
    const utilisateur = this.auth.utilisateur();
    return estPersonnel(utilisateur) ? (utilisateur?.restaurantNom ?? null) : null;
  });

  constructor() {
    let premiere = true;
    effect(() => {
      const n = this.panier.nombreArticles();
      if (premiere || untracked(this.panier.ouvert)) {
        premiere = false;
        return;
      }
      this.annoncePanier.set(
        n === 0 ? 'Panier vide' : `Panier : ${n} ${n > 1 ? 'articles' : 'article'}`,
      );
    });
  }

  protected basculerMenu(): void {
    this.menuOuvert.update((v) => !v);
  }

  protected basculerMenuMobile(): void {
    this.menuMobileOuvert.update((v) => !v);
  }

  /** Un clic hors d'un menu ouvert le ferme. */
  protected clicAilleurs(event: Event): void {
    const cible = event.target as Node;
    const dans = (element?: ElementRef<HTMLElement>) => !!element?.nativeElement.contains(cible);
    if (this.menuOuvert() && !dans(this.compte())) {
      this.menuOuvert.set(false);
    }
    if (this.menuMobileOuvert() && !dans(this.burger()) && !dans(this.navMobile())) {
      this.menuMobileOuvert.set(false);
    }
  }

  /** Echap ferme le menu ouvert et rend le focus a son bouton ; la page ne la recoit pas. */
  protected echap(event: Event): void {
    if (this.menuOuvert()) {
      this.menuOuvert.set(false);
      this.boutonCompte()?.nativeElement.focus();
      event.preventDefault();
    }
    if (this.menuMobileOuvert()) {
      this.menuMobileOuvert.set(false);
      this.burger()?.nativeElement.focus();
      event.preventDefault();
    }
  }

  protected ouvrirPanier(): void {
    this.menuOuvert.set(false);
    this.menuMobileOuvert.set(false);
    this.panier.ouvert.set(true);
  }

  protected seDeconnecter(): void {
    this.menuOuvert.set(false);
    this.menuMobileOuvert.set(false);
    this.auth.deconnecter();
    this.router.navigate(['/menus']);
  }
}
