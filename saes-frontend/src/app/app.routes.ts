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
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/bientot-disponible/bientot-disponible').then((m) => m.BientotDisponible),
    data: { titre: 'Mes commandes' },
  },
  {
    path: 'mes-reservations',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/bientot-disponible/bientot-disponible').then((m) => m.BientotDisponible),
    data: { titre: 'Mes réservations' },
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
  { path: '**', redirectTo: 'menus' },
];
