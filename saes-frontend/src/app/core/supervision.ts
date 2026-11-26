import { inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/**
 * Restaurant supervise par l'administrateur, lu dans l'adresse
 * (`/admin/choix/:restaurantId/...`), ou null pour un gerant qui consulte
 * son propre restaurant.
 *
 * Les pages de statistiques, de rapports, de stocks et de recommandations sont
 * les memes pour le gerant et pour l'administrateur : seule l'adresse appelee
 * change, et l'administrateur n'a que la lecture (voir REFONTE_PLAN.md,
 * ecarts assumes au cahier des charges).
 *
 * A appeler dans le constructeur ou dans un initialiseur de champ d'un composant.
 */
export function restaurantSupervise(): number | null {
  // Le parametre est porte par la route parente de la supervision : on remonte
  // l'arbre des routes jusqu'a le trouver.
  const routes = inject(ActivatedRoute).snapshot.pathFromRoot;
  const valeur = routes.map((r) => r.paramMap.get('restaurantId')).find((v) => v !== null) ?? null;
  const numero = valeur === null ? NaN : Number(valeur);
  return Number.isInteger(numero) ? numero : null;
}

/** Adresse d'une ressource : celle du gerant, ou celle de la supervision. */
export function adresseSupervisee(chemin: string, restaurantId: number | null | undefined): string {
  return restaurantId == null
    ? `/api/gerant/${chemin}`
    : `/api/admin/restaurants/${restaurantId}/${chemin}`;
}
