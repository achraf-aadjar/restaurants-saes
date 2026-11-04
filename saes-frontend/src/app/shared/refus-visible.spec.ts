import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { RefusVisible } from './refus-visible';

@Component({
  imports: [RefusVisible],
  template: `
    @if (erreurPage(); as e) {
      <p class="message-refus">{{ e }}</p>
    }
    <form>
      @if (erreur(); as e) {
        <p class="message-refus">{{ e }}</p>
      }
    </form>
  `,
})
class Page {
  readonly erreurPage = signal<string | null>(null);
  readonly erreur = signal<string | null>(null);
}

describe('RefusVisible', () => {
  // jsdom ne fait pas defiler la page : on verifie seulement que le defilement est demande
  const defiler = vi.fn();
  beforeEach(() => {
    defiler.mockClear();
    Element.prototype.scrollIntoView = defiler;
  });
  afterEach(() => Reflect.deleteProperty(Element.prototype, 'scrollIntoView'));

  it("fait defiler jusqu'au refus quand il apparait", async () => {
    const fixture = TestBed.createComponent(Page);
    await fixture.whenStable();
    expect(defiler).not.toHaveBeenCalled();

    fixture.componentInstance.erreur.set("Le restaurant n'est pas ouvert en ce moment");
    await fixture.whenStable();

    expect(defiler).toHaveBeenCalledExactlyOnceWith({ block: 'nearest' });
  });

  it('refait defiler quand le formulaire renvoye redonne le meme refus', async () => {
    const fixture = TestBed.createComponent(Page);
    fixture.componentInstance.erreurPage.set('Impossible de charger les plats');
    fixture.componentInstance.erreur.set('La recette doit contenir au moins un ingrédient');
    await fixture.whenStable();
    defiler.mockClear();

    const formulaire: HTMLFormElement = fixture.nativeElement.querySelector('form');
    formulaire.dispatchEvent(new Event('submit', { bubbles: true }));
    await fixture.whenStable();

    // Seul le refus du formulaire envoye est concerne, pas celui du haut de la page
    expect(defiler).toHaveBeenCalledOnce();
    expect(defiler.mock.contexts[0]).toBe(formulaire.querySelector('.message-refus'));
  });
});
