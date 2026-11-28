import { describe, expect, it } from 'vitest';

import { adresseSupervisee } from './supervision';

describe('adresseSupervisee', () => {
  it("appelle les routes du gérant quand aucun restaurant n'est supervisé", () => {
    expect(adresseSupervisee('statistiques-ventes', null)).toBe('/api/gerant/statistiques-ventes');
    expect(adresseSupervisee('rapports-financiers', undefined)).toBe(
      '/api/gerant/rapports-financiers',
    );
  });

  it("appelle les routes de supervision de l'administrateur quand un restaurant est choisi", () => {
    expect(adresseSupervisee('statistiques-ventes', 3)).toBe(
      '/api/admin/restaurants/3/statistiques-ventes',
    );
    expect(adresseSupervisee('recommandations', 12)).toBe(
      '/api/admin/restaurants/12/recommandations',
    );
  });
});
