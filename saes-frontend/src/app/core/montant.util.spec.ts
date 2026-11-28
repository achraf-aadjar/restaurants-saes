import { describe, expect, it } from 'vitest';

import { enFrancsCourt, enQuantite } from './montant.util';

describe('enFrancsCourt', () => {
  it('écrit les petits montants en entier', () => {
    expect(enFrancsCourt(0)).toBe('0 FCFA');
    expect(enFrancsCourt(2500).replace(/ | /g, ' ')).toBe('2 500 FCFA');
  });

  it('abrège les milliers à partir de 10 000', () => {
    expect(enFrancsCourt(190000).replace(/ | /g, ' ')).toBe('190 k FCFA');
    expect(enFrancsCourt(9999).replace(/ | /g, ' ')).toBe('9 999 FCFA');
  });

  it('abrège les millions', () => {
    expect(enFrancsCourt(1_016_300).replace(/ | /g, ' ')).toBe('1 M FCFA');
    expect(enFrancsCourt(2_500_000).replace(/ | /g, ' ')).toBe('2,5 M FCFA');
  });

  it('garde le signe des montants négatifs (écart de caisse)', () => {
    expect(enFrancsCourt(-1000).replace(/ | /g, ' ')).toBe('-1 000 FCFA');
  });
});

describe('enQuantite', () => {
  it('arrondit et sépare les milliers', () => {
    expect(enQuantite(349.4)).toBe('349');
    expect(enQuantite(1500).replace(/ | /g, ' ')).toBe('1 500');
  });
});
