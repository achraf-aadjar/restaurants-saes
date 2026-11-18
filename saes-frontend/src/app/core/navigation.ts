import { Router } from '@angular/router';

import { LIBELLES_ROLES } from './libelles';
import { ROLES_PERSONNEL, Role, Utilisateur } from './models';

export interface Fonction {
  libelle: string;
  lien: string;
  /** Tracé de l'icône (24 × 24, au trait), d'après la bibliothèque Lucide. */
  icone: string;
}

/** Cadre arrondi (x, y, largeur, hauteur, rayon), écrit en tracé. */
function cadre(x: number, y: number, l: number, h: number, r: number): string {
  return (
    `M${x + r} ${y}h${l - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}` +
    `a${r} ${r} 0 0 1 -${r} ${r}h-${l - 2 * r}a${r} ${r} 0 0 1 -${r} -${r}` +
    `v-${h - 2 * r}a${r} ${r} 0 0 1 ${r} -${r}z`
  );
}

/** Cercle (centre, rayon), écrit en tracé. */
function rond(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 -${2 * r} 0`;
}

const ICONES = {
  plats:
    'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7',
  menus:
    cadre(3, 4, 18, 18, 2) +
    'M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01',
  stocks:
    'M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73zM12 22V12m-8.7-5 8.7 5 8.7-5M7.5 4.27l9 5.15',
  alerte:
    'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3M12 9v4M12 17h.01',
  rapports: 'M3 3v16a2 2 0 0 0 2 2h16M18 17V9M13 17V5M8 17v-3',
  statistiques: 'M3 3v16a2 2 0 0 0 2 2h16m-2-12-5 5-4-4-3 3',
  approvisionnement:
    rond(8, 21, 1) +
    rond(19, 21, 1) +
    'M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12',
  prendreCommande:
    'M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z',
  commandes:
    cadre(8, 2, 8, 4, 1) +
    'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M12 11h4M12 16h4M8 11h.01M8 16h.01',
  tables:
    cadre(3, 3, 7, 7, 1) + cadre(14, 3, 7, 7, 1) + cadre(14, 14, 7, 7, 1) + cadre(3, 14, 7, 7, 1),
  preparation:
    'M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1ZM6 17h12',
  rupture: rond(12, 12, 10) + 'M4.929 4.929 19.07 19.071',
  ouvrirCaisse: cadre(3, 11, 18, 11, 2) + 'M7 11V7a5 5 0 0 1 9.9-1',
  encaisser: cadre(2, 6, 20, 12, 2) + rond(12, 12, 2) + 'M6 12h.01M18 12h.01',
  cloturerCaisse: cadre(3, 11, 18, 11, 2) + 'M7 11V7a5 5 0 0 1 10 0v4',
  reservations: cadre(3, 4, 18, 18, 2) + 'M16 2v4M8 2v4M3 10h18m-12 6 2 2 4-4',
  comptes:
    rond(9, 7, 4) +
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  restaurants:
    'm2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4M2 7h20M22 7v3a2 2 0 0 1-2 2 2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7',
  historique: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5M12 7v5l4 2',
};

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
      {
        libelle: 'Prendre une commande',
        lien: '/serveur/prendre-commande',
        icone: ICONES.prendreCommande,
      },
      {
        libelle: 'Modifier ou annuler une commande',
        lien: '/serveur/commandes',
        icone: ICONES.commandes,
      },
      {
        libelle: "Visualiser l'occupation des tables",
        lien: '/serveur/occupation',
        icone: ICONES.tables,
      },
    ],
  },
  {
    role: 'CUISINIER',
    intitule: 'Cuisine',
    accueil: '/cuisine/preparation',
    fonctions: [
      {
        libelle: 'Gérer la préparation des commandes',
        lien: '/cuisine/preparation',
        icone: ICONES.preparation,
      },
      { libelle: 'Signaler une rupture', lien: '/cuisine/rupture', icone: ICONES.rupture },
    ],
  },
  {
    role: 'CAISSIER',
    intitule: 'Caisse',
    accueil: '/caissier/encaisser',
    fonctions: [
      { libelle: 'Ouvrir la caisse', lien: '/caissier/ouvrir', icone: ICONES.ouvrirCaisse },
      { libelle: 'Encaisser une commande', lien: '/caissier/encaisser', icone: ICONES.encaisser },
      { libelle: 'Clôturer la caisse', lien: '/caissier/cloturer', icone: ICONES.cloturerCaisse },
    ],
  },
  {
    role: 'GERANT',
    intitule: 'Gestion',
    // Les stocks plutot que les plats : c'est la tache de tous les jours, et la
    // page ou un ingredient sous son seuil d'alerte est signale au gerant.
    accueil: '/gerant/stocks',
    fonctions: [
      { libelle: 'Gérer les plats', lien: '/gerant/plats', icone: ICONES.plats },
      { libelle: 'Gérer les menus', lien: '/gerant/menus', icone: ICONES.menus },
      { libelle: 'Gérer les stocks', lien: '/gerant/stocks', icone: ICONES.stocks },
      {
        libelle: 'Consulter les réservations à venir',
        lien: '/gerant/reservations',
        icone: ICONES.reservations,
      },
      {
        libelle: 'Déclarer une commande abandonnée',
        lien: '/gerant/commandes',
        icone: ICONES.alerte,
      },
      {
        libelle: 'Consulter les rapports financiers',
        lien: '/gerant/rapports-financiers',
        icone: ICONES.rapports,
      },
      {
        libelle: 'Consulter les statistiques de ventes',
        lien: '/gerant/statistiques-ventes',
        icone: ICONES.statistiques,
      },
      {
        libelle: "Consulter les recommandations d'approvisionnement",
        lien: '/gerant/recommandations',
        icone: ICONES.approvisionnement,
      },
    ],
  },
  {
    role: 'ADMINISTRATEUR',
    intitule: 'Administration',
    accueil: '/admin/utilisateurs',
    fonctions: [
      {
        libelle: 'Gérer les comptes utilisateurs',
        lien: '/admin/utilisateurs',
        icone: ICONES.comptes,
      },
      { libelle: 'Gérer les restaurants', lien: '/admin/restaurants', icone: ICONES.restaurants },
      { libelle: 'Historique des opérations', lien: '/admin/journal', icone: ICONES.historique },
    ],
  },
];

/** Sections de la barre laterale d'un utilisateur ; aucune pour un client ou un visiteur. */
export function sectionsDe(utilisateur: Utilisateur | null): Section[] {
  return SECTIONS.filter((section) => utilisateur?.roles.includes(section.role));
}

/** Page ouverte apres la connexion : la tache principale du role, les menus sinon. */
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
