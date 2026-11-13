import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { CommandeClientService } from '../../core/commande-client.service';
import { CommandeDto } from '../../core/models';
import { MesCommandes } from './mes-commandes';

/** Une commande annulée ne se reprend pas (règle 1) : l'annulation demande une confirmation. */
describe('MesCommandes', () => {
  async function ouvrir() {
    const commande = {
      id: 12,
      version: 0,
      statut: 'EN_ATTENTE',
      dateHeure: '2026-11-13T12:00:00',
      montantTotal: 4000,
      lignes: [{ platId: 1, platNom: 'Yassa poulet', quantite: 2, prixUnitaire: 2000 }],
    } as unknown as CommandeDto;
    const service = {
      suivreCommandes: vi.fn(() => of([commande])),
      annuler: vi.fn(() => of(commande)),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: CommandeClientService, useValue: service }],
    });
    const fixture = TestBed.createComponent(MesCommandes);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();

    const racine: HTMLElement = fixture.nativeElement;
    const bouton = (texte: string) =>
      [...racine.querySelectorAll<HTMLButtonElement>('button')].find(
        (b) => b.textContent?.trim() === texte,
      );
    const cliquer = async (texte: string) => {
      bouton(texte)!.click();
      await fixture.whenStable();
    };
    const stable = () => fixture.whenStable();
    return { service, racine, bouton, cliquer, stable };
  }

  it("n'annule pas au premier clic : il demande confirmation", async () => {
    const { service, bouton, cliquer } = await ouvrir();

    await cliquer('Annuler ma commande');

    expect(service.annuler).not.toHaveBeenCalled();
    expect(bouton('Non, garder')).toBe(document.activeElement);
  });

  it('garde la commande si on renonce, et rend le focus au bouton', async () => {
    const { service, bouton, cliquer } = await ouvrir();

    await cliquer('Annuler ma commande');
    await cliquer('Non, garder');

    expect(service.annuler).not.toHaveBeenCalled();
    expect(bouton('Non, garder')).toBeUndefined();
    expect(bouton('Annuler ma commande')).toBe(document.activeElement);
  });

  it('garde la commande si on appuie sur Échap', async () => {
    const { service, bouton, cliquer, stable } = await ouvrir();

    await cliquer('Annuler ma commande');
    bouton('Non, garder')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    await stable();

    expect(service.annuler).not.toHaveBeenCalled();
    expect(bouton('Non, garder')).toBeUndefined();
  });

  it('annule la commande après confirmation', async () => {
    const { service, cliquer } = await ouvrir();

    await cliquer('Annuler ma commande');
    await cliquer('Oui, annuler');

    expect(service.annuler).toHaveBeenCalledExactlyOnceWith(12, { version: 0 });
  });
});
