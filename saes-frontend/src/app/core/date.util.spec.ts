import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

import { estAujourdhui, heureEnLettres, periodeEnLettres } from './date.util';

describe('date.util', () => {
  beforeAll(() => registerLocaleData(localeFr));

  it('ecrit la periode d un menu en toutes lettres, sans repeter le mois', () => {
    expect(periodeEnLettres('2026-10-19', '2026-10-25', 'fr')).toBe(
      'Du lundi 19 au dimanche 25 octobre 2026',
    );
  });

  it('repete le mois, puis l annee, quand ils changent', () => {
    expect(periodeEnLettres('2026-10-26', '2026-11-01', 'fr')).toBe(
      'Du lundi 26 octobre au dimanche 1er novembre 2026',
    );
    expect(periodeEnLettres('2026-12-28', '2027-01-03', 'fr')).toBe(
      'Du lundi 28 décembre 2026 au dimanche 3 janvier 2027',
    );
  });

  it('ecrit un menu sans fin ou d un seul jour', () => {
    expect(periodeEnLettres('2026-06-01', null, 'fr')).toBe('À partir du lundi 1er juin 2026');
    expect(periodeEnLettres('2026-10-23', '2026-10-23', 'fr')).toBe('Le vendredi 23 octobre 2026');
  });

  it('ecrit les heures des horaires sans « 00 »', () => {
    expect(heureEnLettres('11:30:00')).toBe('11 h 30');
    expect(heureEnLettres('15:00:00')).toBe('15 h');
    expect(heureEnLettres('08:05')).toBe('8 h 05');
  });

  it('reconnait un instant d aujourd hui', () => {
    const maintenant = new Date(2026, 10, 3, 15, 0);
    expect(estAujourdhui(new Date(2026, 10, 3, 9, 30).toISOString(), maintenant)).toBe(true);
    expect(estAujourdhui(new Date(2026, 10, 2, 22, 0).toISOString(), maintenant)).toBe(false);
  });
});
