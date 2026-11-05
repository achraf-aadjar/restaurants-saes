import { Router } from '@angular/router';

import { LIBELLES_ROLES } from './libelles';
import { ROLES_PERSONNEL, Role, Utilisateur } from './models';

export interface Fonction {
  libelle: string;
  lien: string;
}

export interface Section {
  role: Role;
  intitule: string;
  /** Page ouverte apres la connexion. */
  accueil: string;
  fonctions: Fonction[];
}

/**
 * Fonctions de chaque role, sous leur intitule dans la barre laterale
 * (organisation_travail_sujet17.pdf, Design). Les libelles sont les noms des
 * fonctions du cahier des charges (§4), dans l'ordre des ecrans de reference.
 */
export const SECTIONS: Section[] = [
  {
    role: 'SERVEUR',
    intitule: 'Salle',
    accueil: '/serveur/prendre-commande',
    fonctions: [
      { libelle: 'Prendre une commande', lien: '/serveur/prendre-commande' },
      { libelle: 'Modifier ou annuler une commande', lien: '/serveur/commandes' },
      { libelle: "Visualiser l'occupation des tables", lien: '/serveur/occupation' },
    ],
  },
  {
    role: 'CUISINIER',
    intitule: 'Cuisine',
    accueil: '/cuisine/preparation',
    fonctions: [
      { libelle: 'Gérer la préparation des commandes', lien: '/cuisine/preparation' },
      { libelle: 'Signaler une rupture', lien: '/cuisine/rupture' },
    ],
  },
  {
    role: 'CAISSIER',
    intitule: 'Caisse',
    accueil: '/caissier/encaisser',
    fonctions: [
      { libelle: 'Ouvrir la caisse', lien: '/caissier/ouvrir' },
      { libelle: 'Encaisser une commande', lien: '/caissier/encaisser' },
      { libelle: 'Clôturer la caisse', lien: '/caissier/cloturer' },
    ],
  },
  {
    role: 'GERANT',
    intitule: 'Gestion',
    accueil: '/gerant/plats',
    fonctions: [
      { libelle: 'Gérer les plats', lien: '/gerant/plats' },
      { libelle: 'Gérer les menus', lien: '/gerant/menus' },
      { libelle: 'Gérer les stocks', lien: '/gerant/stocks' },
      { libelle: 'Déclarer une commande abandonnée', lien: '/gerant/commandes' },
      { libelle: 'Consulter les rapports financiers', lien: '/gerant/rapports-financiers' },
      { libelle: 'Consulter les statistiques de ventes', lien: '/gerant/statistiques-ventes' },
      {
        libelle: "Consulter les recommandations d'approvisionnement",
        lien: '/gerant/recommandations',
      },
    ],
  },
  {
    role: 'ADMINISTRATEUR',
    intitule: 'Administration',
    accueil: '/admin',
    fonctions: [
      { libelle: 'Gérer les comptes utilisateurs', lien: '/admin/utilisateurs' },
      { libelle: 'Gérer les restaurants', lien: '/admin/restaurants' },
      { libelle: 'Historique des opérations', lien: '/admin/journal' },
    ],
  },
];

/** Sections de la barre laterale d'un utilisateur ; aucune pour un client ou un visiteur. */
export function sectionsDe(utilisateur: Utilisateur | null): Section[] {
  return SECTIONS.filter((section) => utilisateur?.roles.includes(section.role));
}

/** Page ouverte apres la connexion : la premiere fonction du personnel, les menus sinon. */
export function accueilDe(utilisateur: Utilisateur | null): string {
  return sectionsDe(utilisateur)[0]?.accueil ?? '/menus';
}

/**
 * Apres la connexion ou l'inscription : la page retenue par la garde
 * (?retour=, par exemple le formulaire ouvert par « Reserver »), sinon
 * l'accueil du role. Si la page retenue n'est pas pour son role, la garde le
 * renvoie a son accueil.
 */
export function allerApresConnexion(router: Router, utilisateur: Utilisateur | null): void {
  const retour = router.routerState.snapshot.root.queryParamMap.get('retour');
  if (retour?.startsWith('/') && !retour.startsWith('/connexion')) {
    router.navigateByUrl(retour);
  } else {
    router.navigate([accueilDe(utilisateur)]);
  }
}

/** Personnel, rattache a un restaurant (cahier des charges §3) ; l'administrateur n'en est pas. */
export function estPersonnel(utilisateur: Utilisateur | null): boolean {
  return ROLES_PERSONNEL.some((role) => utilisateur?.roles.includes(role));
}

/**
 * Nom affiche en haut a droite, comme sur les ecrans de reference :
 * « F. Ndiaye, cuisinier » ; pour un client, « A. Sow ».
 */
export function nomAffiche(utilisateur: Utilisateur): string {
  const nom = `${utilisateur.prenom.charAt(0)}. ${utilisateur.nom}`;
  // Dans l'ordre de la barre laterale, en minuscules apres la virgule.
  const roles = sectionsDe(utilisateur).map((section) =>
    LIBELLES_ROLES[section.role].toLowerCase(),
  );
  return roles.length > 0
    ? `${nom}, ${new Intl.ListFormat('fr', { type: 'conjunction' }).format(roles)}`
    : nom;
}
