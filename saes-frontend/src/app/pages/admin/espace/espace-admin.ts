import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../../core/auth.service';

interface LienAdmin {
  chemin: string;
  libelle: string;
  icone: string;
  exact?: boolean;
}

/** Icones en trait (SVG 24 x 24), dessinees avec currentColor. */
const ICONES: Record<string, string> = {
  vue: 'M3 13h8V3H3zm10 8h8V11h-8zM3 21h8v-6H3zm10-18v6h8V3z',
  finances: 'M3 3v18h18M7 15l4-4 3 3 6-6',
  commandes: 'M6 2h12l1 4H5zM5 6h14v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2zM9 11h6M9 15h6',
  reservations: 'M4 5h16v16H4zM4 10h16M9 3v4M15 3v4',
  caisses: 'M3 7h18v12H3zM3 11h18M7 15h3',
  stocks: 'M21 8l-9-5-9 5 9 5zM3 8v8l9 5 9-5V8M12 13v8',
  restaurants: 'M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6',
  comptes: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM22 19v-1a4 4 0 0 0-3-3.9M16 4.1a3 3 0 0 1 0 5.8',
  historique: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 3',
};

/**
 * Espace d'administration : navigation laterale (supervision de tous les
 * restaurants, gestion des restaurants et des comptes, historique en bas).
 */
@Component({
  selector: 'app-espace-admin',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './espace-admin.html',
  styleUrl: './espace-admin.scss',
})
export class EspaceAdmin {
  protected readonly auth = inject(AuthService);
  protected readonly icones = ICONES;

  protected readonly sections: { titre: string; liens: LienAdmin[] }[] = [
    {
      titre: 'Pilotage',
      liens: [
        { chemin: '/admin', libelle: "Vue d'ensemble", icone: 'vue', exact: true },
        { chemin: '/admin/finances', libelle: 'Finances', icone: 'finances' },
      ],
    },
    {
      titre: 'Activité',
      liens: [
        { chemin: '/admin/commandes', libelle: 'Commandes', icone: 'commandes' },
        { chemin: '/admin/reservations', libelle: 'Réservations', icone: 'reservations' },
        { chemin: '/admin/caisses', libelle: 'Caisses', icone: 'caisses' },
        { chemin: '/admin/stocks', libelle: 'Stocks', icone: 'stocks' },
      ],
    },
    {
      titre: 'Gestion',
      liens: [
        { chemin: '/admin/restaurants', libelle: 'Restaurants', icone: 'restaurants' },
        { chemin: '/admin/utilisateurs', libelle: 'Comptes', icone: 'comptes' },
      ],
    },
  ];

  protected readonly historique: LienAdmin = { chemin: '/admin/journal', libelle: 'Historique', icone: 'historique' };
}
