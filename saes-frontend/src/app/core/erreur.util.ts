import { HttpErrorResponse } from '@angular/common/http';

/**
 * L'API renvoie les refus au format { "motif": "..." } (web/error/ErrorResponse.java).
 */
export function motifErreur(erreur: unknown, motifParDefaut = 'Une erreur est survenue'): string {
  if (erreur instanceof HttpErrorResponse) {
    const motif = (erreur.error as { motif?: string } | null)?.motif;
    if (motif) {
      return motif;
    }
    if (erreur.status === 0) {
      return 'Serveur injoignable. Verifiez que saes-backend est demarre.';
    }
  }
  return motifParDefaut;
}
