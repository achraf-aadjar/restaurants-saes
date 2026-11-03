import { Role, Utilisateur } from './models';
import { accueilDe, estPersonnel, nomAffiche, sectionsDe } from './navigation';

function utilisateur(...roles: Role[]): Utilisateur {
  return {
    id: 1,
    nom: 'Faye',
    prenom: 'Khadim',
    email: 'khadim@test.sn',
    telephone: null,
    roles,
    restaurantId: 1,
    restaurantNom: "Restaurant de l'EPT",
    estActif: true,
  };
}

describe('Navigation par role', () => {
  it("un client ou un visiteur n'a pas de barre laterale et arrive sur les menus", () => {
    expect(sectionsDe(null)).toEqual([]);
    expect(sectionsDe(utilisateur('CLIENT'))).toEqual([]);
    expect(accueilDe(utilisateur('CLIENT'))).toBe('/menus');
  });

  it('chaque role a son intitule ; plusieurs roles donnent plusieurs sections', () => {
    const intitules = sectionsDe(utilisateur('GERANT', 'CAISSIER')).map((s) => s.intitule);
    expect(intitules).toEqual(['Caisse', 'Gestion']);
  });

  it('le caissier arrive sur « Encaisser une commande »', () => {
    expect(accueilDe(utilisateur('CAISSIER'))).toBe('/caissier/encaisser');
  });

  it("l'administrateur n'est pas du personnel (cahier des charges §3)", () => {
    expect(estPersonnel(utilisateur('ADMINISTRATEUR'))).toBe(false);
    expect(estPersonnel(utilisateur('SERVEUR'))).toBe(true);
    expect(sectionsDe(utilisateur('ADMINISTRATEUR')).map((s) => s.intitule)).toEqual([
      'Administration',
    ]);
  });

  it('le nom (initiale du prenom) est suivi des roles en francais', () => {
    expect(nomAffiche(utilisateur('CLIENT'))).toBe('K. Faye');
    expect(nomAffiche(utilisateur('CUISINIER'))).toBe('K. Faye, cuisinier');
    // Meme ordre que la barre laterale : Caisse, puis Gestion.
    expect(nomAffiche(utilisateur('GERANT', 'CAISSIER'))).toBe('K. Faye, caissier et gérant');
  });
});
