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
    path: 'serveur/occupation',
    canActivate: [roleGuard('SERVEUR')],
    loadComponent: () =>
      import('./pages/serveur/occupation-tables').then((m) => m.OccupationTables),
  },
  {
    path: 'cuisine',
    canActivate: [roleGuard('CUISINIER')],
    loadComponent: () => import('./pages/cuisine/cuisine').then((m) => m.Cuisine),
  },
  {
    path: 'gerant/commandes',
    canActivate: [roleGuard('GERANT')],
    loadComponent: () =>
      import('./pages/gerant/commandes-abandon').then((m) => m.CommandesAbandon),
  },
  { path: '**', redirectTo: 'menus' },
];
