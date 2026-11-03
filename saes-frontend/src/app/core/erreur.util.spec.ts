import { HttpErrorResponse } from '@angular/common/http';

import { motifErreur } from './erreur.util';

describe('motifErreur', () => {
  it("affiche le motif de refus renvoye par l'API", () => {
    const erreur = new HttpErrorResponse({ status: 409, error: { motif: "Cette commande n'est plus en attente" } });

    expect(motifErreur(erreur)).toBe("Cette commande n'est plus en attente");
  });

  it('signale un serveur injoignable', () => {
    expect(motifErreur(new HttpErrorResponse({ status: 0 }))).toContain('Serveur injoignable');
  });

  it('utilise le motif par defaut sinon', () => {
    expect(motifErreur(new HttpErrorResponse({ status: 500 }), 'Action impossible')).toBe('Action impossible');
    expect(motifErreur(new Error('inattendu'))).toBe('Une erreur est survenue');
  });
});
