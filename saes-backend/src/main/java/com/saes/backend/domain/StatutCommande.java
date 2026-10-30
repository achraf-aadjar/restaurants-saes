package com.saes.backend.domain;

/**
 * Cycle de vie d'une commande (support_comprehension_conception.pdf,
 * diagramme d'etats). EN_ATTENTE -> EN_PREPARATION -> PRETE -> PAYEE, avec
 * les sorties ANNULEE (depuis EN_ATTENTE) et ABANDONNEE (depuis
 * EN_PREPARATION ou PRETE). PAYEE, ANNULEE, ABANDONNEE sont terminaux.
 */
public enum StatutCommande {
    EN_ATTENTE,
    EN_PREPARATION,
    PRETE,
    PAYEE,
    ANNULEE,
    ABANDONNEE
}
