import { Routes } from '@angular/router';

import { authGuard, roleGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'menus' },
  {
    path: 'menus',
    loadComponent: () => import('./pages/menus/menu-consultation').then((m) => m.MenuConsultation),
  },
  {
    path: 'connexion',
    loadComponent: () => import('./pages/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'inscription',
    loadComponent: () => import('./pages/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'mon-compte',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/account/mon-compte').then((m) => m.MonCompte),
  },
  {
    path: 'confidentialite',
    loadComponent: () => import('./pages/confidentialite/confidentialite').then((m) => m.Confidentialite),
  },
  {
    path: 'mes-commandes',
    canActivate: [roleGuard('CLIENT')],
    loadComponent: () => import('./pages/mes-commandes/mes-commandes').then((m) => m.MesCommandes),
  },
  {
    path: 'mes-reservations',
    canActivate: [roleGuard('CLIENT')],
    loadComponent: () =>
      import('./pages/mes-reservations/mes-reservations').then((m) => m.MesReservations),
  },
  {
    path: 'admin/utilisateurs',
    canActivate: [roleGuard('ADMINISTRATEUR')],
    loadComponent: () => import('./pages/admin/users/users-list').then((m) => m.UsersList),
  },
  {
    path: 'admin/restaurants',
    canActivate: [roleGuard('ADMINISTRATEUR')],
    loadComponent: () =>
      import('./pages/admin/restaurants/restaurants-list').then((m) => m.RestaurantsList),
  },
  {
    path: 'serveur/prendre-commande',
    canActivate: [roleGuard('SERVEUR')],
    loadComponent: () => import('./pages/serveur/prendre-commande').then((m) => m.PrendreCommande),
  },
  {
    path: 'serveur/commandes',
    canActivate: [roleGuard('SERVEUR')],
    loadComponent: () =>
      import('./pages/serveur/commandes-en-attente').then((m) => m.CommandesEnAttente),
  },
  {
    path: 'serveur/occupation',
    canActivate: [roleGuard('SERVEUR')],
    loadComponent: () =>
      import('./pages/serveur/occupation-tables').then((m) => m.OccupationTables),
  },
  {
    path: 'cuisine/preparation',
    canActivate: [roleGuard('CUISINIER')],
    loadComponent: () => import('./pages/cuisine/cuisine').then((m) => m.Cuisine),
  },
  {
    path: 'cuisine/rupture',
    canActivate: [roleGuard('CUISINIER')],
    loadComponent: () => import('./pages/cuisine/signaler-rupture').then((m) => m.SignalerRupture),
  },
  {
    path: 'gerant/commandes',
    canActivate: [roleGuard('GERANT')],
    loadComponent: () =>
      import('./pages/gerant/commandes-abandon').then((m) => m.CommandesAbandon),
  },
  {
    path: 'gerant/plats',
    canActivate: [roleGuard('GERANT')],
    loadComponent: () => import('./pages/gerant/plats').then((m) => m.GerantPlats),
  },
  {
    path: 'gerant/menus',
    canActivate: [roleGuard('GERANT')],
    loadComponent: () => import('./pages/gerant/menus').then((m) => m.GerantMenus),
  },
  {
    path: 'gerant/stocks',
    canActivate: [roleGuard('GERANT')],
    loadComponent: () => import('./pages/gerant/stocks').then((m) => m.GerantStocks),
  },
  {
    path: 'gerant/recommandations',
    canActivate: [roleGuard('GERANT')],
    loadComponent: () =>
      import('./pages/gerant/recommandations').then((m) => m.GerantRecommandations),
  },
  {
    path: 'gerant/rapports-financiers',
    canActivate: [roleGuard('GERANT')],
    loadComponent: () =>
      import('./pages/gerant/rapports-financiers').then((m) => m.GerantRapportsFinanciers),
  },
  {
    path: 'gerant/statistiques-ventes',
    canActivate: [roleGuard('GERANT')],
    loadComponent: () =>
      import('./pages/gerant/statistiques-ventes').then((m) => m.GerantStatistiquesVentes),
  },
  {
    path: 'caissier/ouvrir',
    canActivate: [roleGuard('CAISSIER')],
    loadComponent: () => import('./pages/caissier/ouvrir-caisse').then((m) => m.OuvrirCaisse),
  },
  {
    path: 'caissier/encaisser',
    canActivate: [roleGuard('CAISSIER')],
    loadComponent: () =>
      import('./pages/caissier/encaisser-commande').then((m) => m.EncaisserCommande),
  },
  {
    path: 'caissier/cloturer',
    canActivate: [roleGuard('CAISSIER')],
    loadComponent: () => import('./pages/caissier/cloturer-caisse').then((m) => m.CloturerCaisse),
  },
  { path: '**', redirectTo: 'menus' },
];
