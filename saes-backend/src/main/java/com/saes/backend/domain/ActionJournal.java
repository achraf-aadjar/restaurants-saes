package com.saes.backend.domain;

import java.util.Set;

/** Operations sensibles enregistrees dans l'historique. */
public enum ActionJournal {
    CAISSE_OUVERTE,
    COMMANDE_ENCAISSEE,
    CAISSE_CLOTUREE,
    COMMANDE_MODIFIEE,
    COMMANDE_ANNULEE,
    COMMANDE_ABANDONNEE,
    RUPTURE_SIGNALEE,
    COMPTE_CREE,
    ROLES_MODIFIES,
    COMPTE_ACTIVE,
    COMPTE_DESACTIVE,
    RESTAURANT_CREE,
    RESTAURANT_MODIFIE,
    RESTAURANT_ACTIVE,
    RESTAURANT_DESACTIVE;

    /**
     * Actions que l'administrateur consulte : celles de son domaine (comptes et
     * restaurants). Les operations de caisse et de commandes restent enregistrees,
     * mais relevent des restaurants, pas de l'administrateur.
     */
    public static final Set<ActionJournal> ADMINISTRATION = Set.of(
            COMPTE_CREE, ROLES_MODIFIES, COMPTE_ACTIVE, COMPTE_DESACTIVE,
            RESTAURANT_CREE, RESTAURANT_MODIFIE, RESTAURANT_ACTIVE, RESTAURANT_DESACTIVE);
}
