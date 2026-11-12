import { TestBed } from '@angular/core/testing';

import { ChoixPeriode, Periode } from './choix-periode';

describe('ChoixPeriode', () => {
  async function ouvrir() {
    const fixture = TestBed.createComponent(ChoixPeriode);
    fixture.componentRef.setInput('debut', '2026-10-13');
    fixture.componentRef.setInput('fin', '2026-11-12');
    const choisies: Periode[] = [];
    fixture.componentInstance.choisie.subscribe((p) => choisies.push(p));
    await fixture.whenStable();

    const racine: HTMLElement = fixture.nativeElement;
    racine.querySelector<HTMLButtonElement>('.btn-periode')!.click();
    await fixture.whenStable();

    const saisir = async (id: string, valeur: string) => {
      const champ = racine.querySelector<HTMLInputElement>(`#${id}`)!;
      champ.value = valeur;
      champ.dispatchEvent(new Event('input', { bubbles: true }));
      await fixture.whenStable();
    };
    const afficher = async () => {
      racine.querySelector<HTMLButtonElement>('.formulaire-periode .btn-primaire')!.click();
      await fixture.whenStable();
    };
    const message = () => racine.querySelector('.message-refus')?.textContent?.trim() ?? null;
    return { fixture, racine, choisies, saisir, afficher, message };
  }

  it('refuse une période dont la fin précède le début, sans la transmettre', async () => {
    const { racine, choisies, saisir, afficher, message } = await ouvrir();

    await saisir('periode-debut', '2026-12-31');
    await saisir('periode-fin', '2026-01-01');
    await afficher();

    expect(message()).toBe('La date de fin ne peut pas être avant la date de début');
    expect(choisies).toEqual([]);
    expect(racine.querySelector('#panneau-periode')).not.toBeNull();
  });

  it('refuse une date vide', async () => {
    const { choisies, saisir, afficher, message } = await ouvrir();

    await saisir('periode-debut', '');
    await afficher();

    expect(message()).toBe('Choisissez la date de début et la date de fin.');
    expect(choisies).toEqual([]);
  });

  it('transmet une période valide et referme le panneau', async () => {
    const { racine, choisies, saisir, afficher, message } = await ouvrir();

    await saisir('periode-debut', '2026-01-01');
    await saisir('periode-fin', '2026-12-31');
    await afficher();

    expect(choisies).toEqual([{ debut: '2026-01-01', fin: '2026-12-31' }]);
    expect(message()).toBeNull();
    expect(racine.querySelector('#panneau-periode')).toBeNull();
  });

  it('referme le panneau avec Échap', async () => {
    const { fixture, racine } = await ouvrir();

    racine
      .querySelector('#panneau-periode')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();

    expect(racine.querySelector('#panneau-periode')).toBeNull();
  });
});
