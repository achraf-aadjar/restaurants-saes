import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';
import { filter, take } from 'rxjs';

import { AuthService } from '../../core/auth.service';
import { CommandeClientService } from '../../core/commande-client.service';
import { motifErreur } from '../../core/erreur.util';
import { PanierService } from '../../core/panier.service';
import { PlatResume } from '../../core/models';
import { CompteurQuantite } from '../../shared/compteur-quantite';
import { MontantPipe } from '../../shared/montant.pipe';
import { PhotoPlat } from '../../shared/photo-plat';

/** Marque de l'entree d'historique ajoutee a l'ouverture du panneau. */
const ETAT_PANIER = 'saesPanierOuvert';

/**
 * Le panneau « Votre panier », ouvert par le bouton « Panier » de l'en-tete.
 * C'est une fenetre modale (W3C, APG
 * « Dialog (Modal) ») : le reste de la page est inerte, Echap ou × la ferment
 * et le focus revient au bouton qui l'a ouverte. « Passer la commande » envoie
 * la commande (cahier des charges §4.3) ; un visiteur va d'abord se connecter
 * ou creer son compte, et le panneau se rouvre ensuite avec son panier.
 *
 * Le bouton Retour du navigateur (ou du telephone) ferme le panneau et laisse
 * sur la page (Baymard, NN/g : l'utilisateur s'y attend, sur ordinateur comme
 * sur telephone). Chrome et Firefox sur Android le font deja pour une fenetre
 * ouverte par showModal() ; ailleurs (ordinateur, iPhone), une entree
 * d'historique est ajoutee a l'ouverture : Retour la retire et ferme le
 * panneau. Fermer autrement (×, Echap, voile) retire cette entree.
 */
@Component({
  selector: 'app-panneau-panier',
  imports: [CompteurQuantite, MontantPipe, PhotoPlat],
  templateUrl: './panneau-panier.html',
  host: { '(window:popstate)': 'surHistorique($event)' },
  styleUrl: './panneau-panier.scss',
})
export class PanneauPanier {
  protected readonly panier = inject(PanierService);
  protected readonly auth = inject(AuthService);
  private readonly commandeClientService = inject(CommandeClientService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);

  private readonly fenetre = viewChild.required<ElementRef<HTMLDialogElement>>('fenetre');
  private readonly confirmation = viewChild<ElementRef<HTMLElement>>('confirmation');

  protected readonly envoiEnCours = signal(false);
  protected readonly commandeConfirmee = signal(false);
  protected readonly erreur = signal<string | null>(null);
  /** « Panier : 2 articles », lu quand une quantite change, panneau ouvert. */
  protected readonly annonce = signal('');

  /** Le bouton qui a ouvert le panneau : il retrouve le focus a la fermeture. */
  private ouvreur: HTMLElement | null = null;
  /** L'entree d'historique du panneau est l'entree courante. */
  private entreeHistorique = false;

  constructor() {
    effect(() => {
      const fenetre = this.fenetre().nativeElement;
      if (this.panier.ouvert() && !fenetre.open) {
        this.ouvreur = document.activeElement as HTMLElement | null;
        const racine = document.documentElement;
        racine.style.setProperty(
          '--largeur-barre-defilement',
          `${window.innerWidth - racine.clientWidth}px`,
        );
        fenetre.showModal();
        this.ajouterEntreeHistorique();
      } else if (!this.panier.ouvert() && fenetre.open) {
        fenetre.close();
      }
    });

    // Filet : si la page change par Retour ou Avant alors que le panneau est
    // ouvert (entree d'historique absente), le panneau ne reste pas par-dessus.
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationStart && e.navigationTrigger === 'popstate'),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe(() => {
        this.entreeHistorique = false;
        this.fermer();
      });

    let precedent: number | null = null;
    effect(() => {
      const n = this.panier.nombreArticles();
      if (!this.panier.ouvert()) {
        this.annonce.set('');
        precedent = null;
        return;
      }
      if (precedent !== null && n !== precedent && !this.commandeConfirmee()) {
        this.annonce.set(
          n === 0 ? 'Panier vide' : `Panier : ${n} ${n > 1 ? 'articles' : 'article'}`,
        );
      }
      precedent = n;
    });
  }

  private estEntreeDuPanneau(): boolean {
    return (history.state as Record<string, unknown> | null)?.[ETAT_PANIER] === true;
  }

  /**
   * Ajoute l'entree d'historique du panneau, a l'adresse de la page. Si une
   * navigation est en cours (panneau rouvert apres la connexion), on attend
   * qu'elle soit finie : l'entree doit etre celle de la page d'arrivee.
   */
  private ajouterEntreeHistorique(): void {
    const ajouter = () => {
      if (!this.panier.ouvert()) return;
      if (!this.estEntreeDuPanneau()) {
        history.pushState({ ...(history.state ?? {}), [ETAT_PANIER]: true }, '');
      }
      this.entreeHistorique = true;
    };
    if (!this.router.currentNavigation()) {
      ajouter();
      return;
    }
    this.router.events
      .pipe(
        filter(
          (e) =>
            e instanceof NavigationEnd ||
            e instanceof NavigationCancel ||
            e instanceof NavigationError,
        ),
        take(1),
      )
      .subscribe(ajouter);
  }

  /**
   * Retour depuis l'entree du panneau : il se ferme, la page reste. Avant
   * jusqu'a cette entree : il se rouvre. L'adresse est la meme, le routeur ne
   * change pas de page.
   */
  protected surHistorique(event: PopStateEvent): void {
    if ((event.state as Record<string, unknown> | null)?.[ETAT_PANIER] === true) {
      this.entreeHistorique = true;
      this.panier.ouvert.set(true);
    } else if (this.entreeHistorique) {
      this.entreeHistorique = false;
      this.fermer();
    }
  }

  /** Fermee par Echap, par × ou par le programme : tout revient a l'etat ferme. */
  protected apresFermeture(): void {
    // Fermee autrement que par Retour : l'entree du panneau est retiree, pour
    // que le prochain Retour aille bien a la page precedente.
    if (this.entreeHistorique && this.estEntreeDuPanneau()) history.back();
    this.entreeHistorique = false;
    this.panier.ouvert.set(false);
    this.commandeConfirmee.set(false);
    this.erreur.set(null);
    // Rouvert apres la connexion, le panneau n'a pas d'ouvreur : le focus va
    // au bouton « Panier » de l'en-tete.
    const retour = this.ouvreur?.isConnected
      ? this.ouvreur
      : document.querySelector<HTMLElement>('.bouton-panier');
    retour?.focus();
    this.ouvreur = null;
  }

  protected fermer(): void {
    this.panier.ouvert.set(false);
  }

  /** Un clic sur le voile, hors du panneau, le ferme. */
  protected clicFenetre(event: MouseEvent): void {
    if (event.target === this.fenetre().nativeElement) this.fermer();
  }

  /** « − » : a zero, la ligne disparait ; le focus ne doit pas se perdre. */
  protected retirer(plat: PlatResume, index: number): void {
    this.panier.retirer(plat);
    if (this.panier.quantite(plat.id) === 0) this.focusApresRetrait(index);
  }

  /** La corbeille : la ligne disparait. */
  protected enlever(plat: PlatResume, index: number): void {
    this.panier.enlever(plat);
    this.focusApresRetrait(index);
  }

  /**
   * Le bouton qui avait le focus a disparu avec sa ligne : le focus passe a la
   * corbeille de la ligne qui prend sa place (ou de la derniere), et au bouton
   * × si le panier est vide.
   */
  private focusApresRetrait(index: number): void {
    afterNextRender(
      () => {
        const fenetre = this.fenetre().nativeElement;
        const corbeilles = fenetre.querySelectorAll<HTMLElement>('.corbeille');
        const cible = corbeilles[Math.min(index, corbeilles.length - 1)];
        (cible ?? fenetre.querySelector<HTMLElement>('.fermer'))?.focus();
      },
      { injector: this.injector },
    );
  }

  protected passerCommande(): void {
    const restaurantId = this.panier.restaurantId();
    const lignes = this.panier.lignes();
    if (!restaurantId || lignes.length === 0) return;

    if (!this.auth.estConnecte()) {
      this.panier.rouvrirApresConnexion();
      // Revenir a la page ou il etait, sauf s'il etait deja sur la connexion.
      const url = this.router.url;
      const retour = /^\/(connexion|inscription)\b/.test(url) ? '/menus' : url;
      this.allerVers(['/connexion'], { retour });
      return;
    }

    this.erreur.set(null);
    this.envoiEnCours.set(true);
    this.commandeClientService
      .passerCommande({
        restaurantId,
        lignes: lignes.map((l) => ({ platId: l.plat.id, quantite: l.quantite })),
      })
      .subscribe({
        next: () => {
          this.envoiEnCours.set(false);
          this.commandeConfirmee.set(true);
          this.panier.vider();
          // Le bouton « Passer la commande » a disparu : le focus va au message.
          afterNextRender(() => this.confirmation()?.nativeElement.focus(), {
            injector: this.injector,
          });
        },
        error: (err) => {
          this.envoiEnCours.set(false);
          this.erreur.set(motifErreur(err, "La commande n'a pas pu être enregistrée"));
        },
      });
  }

  protected voirMesCommandes(): void {
    this.allerVers(['/mes-commandes']);
  }

  /**
   * Quitte le panneau pour une autre page. La nouvelle page prend la place de
   * l'entree d'historique du panneau : Retour ramene ensuite a la page d'ou le
   * panneau a ete ouvert.
   */
  private allerVers(chemin: string[], queryParams?: Record<string, string>): void {
    const remplacer = this.entreeHistorique && this.estEntreeDuPanneau();
    this.entreeHistorique = false;
    this.ouvreur = null;
    this.fermer();
    this.router.navigate(chemin, { queryParams, replaceUrl: remplacer });
  }
}
