import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { MontantPipe } from './montant.pipe';

describe('MontantPipe', () => {
  let pipe: MontantPipe;

  beforeEach(() => {
    registerLocaleData(localeFr);
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'fr' }] });
    pipe = TestBed.runInInjectionContext(() => new MontantPipe());
  });

  it('separe les milliers par une espace, comme en francais', () => {
    expect(pipe.transform(20000)).toBe('20\u202f000\u00a0FCFA');
    expect(pipe.transform(700)).toBe('700\u00a0FCFA');
  });

  it("arrondit a l'unite", () => {
    expect(pipe.transform(3150.4)).toBe('3\u202f150\u00a0FCFA');
  });

  it('affiche un tiret sans montant', () => {
    expect(pipe.transform(null)).toBe('—');
  });
});
