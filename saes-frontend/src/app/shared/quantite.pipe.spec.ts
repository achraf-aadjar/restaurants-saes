import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { QuantitePipe } from './quantite.pipe';

describe('QuantitePipe', () => {
  let pipe: QuantitePipe;

  beforeEach(() => {
    registerLocaleData(localeFr);
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'fr' }] });
    pipe = TestBed.runInInjectionContext(() => new QuantitePipe());
  });

  it("ecrit la quantite dans l'unite de l'ingredient, avec son symbole", () => {
    expect(pipe.transform(150, 'GRAMME')).toBe('150\u00a0g');
    expect(pipe.transform(30, 'MILLILITRE')).toBe('30\u00a0ml');
  });

  it('ecrit les nombres a la francaise : espace pour les milliers, virgule pour les decimales', () => {
    expect(pipe.transform(2000, 'GRAMME')).toBe('2\u202f000\u00a0g');
    expect(pipe.transform(0.3, 'KILOGRAMME')).toBe('0,3\u00a0kg');
    expect(pipe.transform(1.25, 'LITRE')).toBe('1,25\u00a0L');
  });

  it('met les pieces au pluriel a partir de 2', () => {
    expect(pipe.transform(1, 'PIECE')).toBe('1\u00a0pièce');
    expect(pipe.transform(1.5, 'PIECE')).toBe('1,5\u00a0pièce');
    expect(pipe.transform(12, 'PIECE')).toBe('12\u00a0pièces');
  });

  it('affiche un tiret sans quantite', () => {
    expect(pipe.transform(null, 'GRAMME')).toBe('—');
  });
});
