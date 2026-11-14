import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AuthService } from '../../core/auth.service';
import { CommandeServeurService } from '../../core/commande-serveur.service';
import { MenuService } from '../../core/menu.service';
import { CommandeDto, MenuDto } from '../../core/models';
import { PrendreCommande } from './prendre-commande';

/**
 * Le serveur modifie une commande en attente (cahier des charges §4.3) : il change les plats
 * et les quantités, le type et la table restent ceux de la commande.
 */
describe('PrendreCommande en modification', () => {
  async function ouvrir(lignes = [{ platId: 1, platNom: 'Yassa poulet', quantite: 2, prixUnitaire: 2000 }]) {
    const yassa = { id: 1, nom: 'Yassa poulet', description: null, prix: 2000, categorie: 'PLAT_PRINCIPAL' };
    const bissap = { id: 2, nom: 'Jus de bissap', description: null, prix: 500, categorie: 'BOISSON' };
    const commande = {
      id: 44,
      version: 3,
      type: 'SUR_PLACE',
      tableId: 7,
      tableNumero: 2,
      statut: 'EN_ATTENTE',
      dateHeure: '2026-11-14T12:00:00',
      montantTotal: 4000,
      lignes,
    } as unknown as CommandeDto;
    const service = {
      commandesEnAttente: vi.fn(() => of([commande])),
      occupationTables: vi.fn(() =>
        of({ tables: [{ id: 7, numero: 2, capacite: 4, occupee: true }] }),
      ),
      modifierCommande: vi.fn(() => of(commande)),
      prendreCommande: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'serveur/commandes', children: [] }]),
        { provide: CommandeServeurService, useValue: service },
        {
          provide: MenuService,
          useValue: { menusEnVigueur: () => of([{ plats: [yassa, bissap] } as unknown as MenuDto]) },
        },
        { provide: AuthService, useValue: { utilisateur: () => ({ restaurantId: 1 }) } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '44' }) } },
        },
      ],
    });
    const fixture = TestBed.createComponent(PrendreCommande);
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    const racine: HTMLElement = fixture.nativeElement;
    const cliquer = async (selecteur: string) => {
      racine.querySelector<HTMLButtonElement>(selecteur)!.click();
      await fixture.whenStable();
    };
    return { service, racine, cliquer };
  }

  it('reprend la commande et envoie les nouvelles quantités avec sa version', async () => {
    const { service, racine, cliquer } = await ouvrir();

    expect(racine.querySelector('h1')?.textContent).toContain('Modifier la commande 44');
    expect(racine.querySelector('[aria-label="Quantité de Yassa poulet"] .quantite')?.textContent).toBe('2');

    await cliquer('[aria-label="Retirer un Yassa poulet"]');
    await cliquer('[aria-label="Ajouter un Jus de bissap"]');
    await cliquer('[aria-label="Ajouter un Jus de bissap"]');
    await cliquer('.btn-enregistrer');

    expect(service.prendreCommande).not.toHaveBeenCalled();
    expect(service.modifierCommande).toHaveBeenCalledWith(44, {
      lignes: [
        { platId: 1, quantite: 1 },
        { platId: 2, quantite: 2 },
      ],
      version: 3,
    });
  });

  it("garde un plat qui n'est plus proposé : on peut le diminuer, pas l'augmenter", async () => {
    const { service, racine, cliquer } = await ouvrir([
      { platId: 1, platNom: 'Yassa poulet', quantite: 1, prixUnitaire: 2000 },
      { platId: 9, platNom: 'Jus de bouye', quantite: 2, prixUnitaire: 500 },
    ]);

    expect(racine.textContent).toContain('Plus disponibles');
    expect(racine.querySelector<HTMLButtonElement>('[aria-label="Ajouter un Jus de bouye"]')!.disabled).toBe(true);

    await cliquer('[aria-label="Retirer un Jus de bouye"]');
    await cliquer('.btn-enregistrer');

    expect(service.modifierCommande).toHaveBeenCalledWith(44, {
      lignes: [
        { platId: 1, quantite: 1 },
        { platId: 9, quantite: 1 },
      ],
      version: 3,
    });
  });

  it('ne laisse changer ni le type ni la table', async () => {
    const { racine } = await ouvrir();

    const types = [...racine.querySelectorAll<HTMLButtonElement>('.type-commande .choix')];
    expect(types.every((b) => b.disabled)).toBe(true);
    expect(racine.querySelector<HTMLSelectElement>('#table')!.disabled).toBe(true);
  });
});
