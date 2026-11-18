/**
 * Fiche ou formulaire ouvert dans la page, fermé partout de la même façon :
 * Échap, ou un second clic sur ce qui l'a ouvert. S'il a été modifié sans être
 * enregistré, on demande d'abord confirmation, pour ne rien perdre par erreur.
 * À la fermeture, le focus du clavier revient au bouton qui l'a ouvert.
 */
export class SuiviFormulaire {
  private etatInitial = '';
  private declencheur: HTMLElement | null = null;

  /** À appeler une fois le formulaire rempli, avec les valeurs qu'il montre. */
  ouvert(etat: unknown): void {
    this.etatInitial = JSON.stringify(etat);
    const actif = document.activeElement;
    this.declencheur = actif instanceof HTMLElement && actif !== document.body ? actif : null;
  }

  /** Vrai si rien n'a changé, ou si l'on accepte de perdre ses modifications. */
  peutFermer(etat: unknown): boolean {
    return (
      JSON.stringify(etat) === this.etatInitial ||
      window.confirm('Fermer sans enregistrer vos modifications ?')
    );
  }

  /** Rend le focus au bouton qui a ouvert le formulaire, s'il est encore dans la page. */
  rendreFocus(): void {
    const element = this.declencheur;
    this.declencheur = null;
    setTimeout(() => {
      if (element?.isConnected) element.focus();
    });
  }
}

/**
 * Amène à l'écran l'élément qui vient d'apparaître, s'il est hors de vue : un
 * formulaire s'ouvre en haut de la page, alors qu'on a pu cliquer une ligne bas
 * dans une longue liste.
 */
export function amenerALEcran(selecteur: string): void {
  setTimeout(() => {
    const element = document.querySelector(selecteur);
    if (!element) return;
    const { top } = element.getBoundingClientRect();
    if (top < 0 || top > window.innerHeight * 0.75) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

/** Élément de la page qui a le focus du clavier se trouve-t-il dans `selecteur` ? */
export function focusDans(selecteur: string): boolean {
  return !!document.activeElement?.closest(selecteur);
}
