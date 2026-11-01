import { StatutCommande } from './models';

export const LIBELLES_STATUT_COMMANDE: Record<StatutCommande, string> = {
  EN_ATTENTE: 'En attente',
  EN_PREPARATION: 'En préparation',
  PRETE: 'Prête',
  PAYEE: 'Payée',
  ANNULEE: 'Annulée',
  ABANDONNEE: 'Abandonnée',
};

export function classeBadgeStatut(statut: StatutCommande): string {
  switch (statut) {
    case 'PAYEE':
    case 'PRETE':
      return 'badge-actif';
    case 'ANNULEE':
    case 'ABANDONNEE':
      return 'badge-inactif';
    default:
      return 'badge-attente';
  }
}
