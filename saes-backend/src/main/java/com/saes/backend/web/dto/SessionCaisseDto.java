package com.saes.backend.web.dto;

import java.time.Instant;

import com.saes.backend.domain.SessionCaisse;

/**
 * montantTheorique et ecart ne sont renvoyes qu'a la cloture (glossaire du
 * cahier des charges) ; absents tant que la caisse est ouverte.
 */
public record SessionCaisseDto(
        Long id,
        Instant dateHeureOuverture,
        Integer fondDeCaisse,
        Instant dateHeureCloture,
        Integer montantCompte,
        Integer montantTheorique,
        Integer ecart) {

    public static SessionCaisseDto ouverte(SessionCaisse s) {
        return new SessionCaisseDto(
                s.getId(), s.getDateHeureOuverture(), s.getFondDeCaisse(), null, null, null, null);
    }

    public static SessionCaisseDto cloturee(SessionCaisse s, int montantTheorique, int ecart) {
        return new SessionCaisseDto(
                s.getId(),
                s.getDateHeureOuverture(),
                s.getFondDeCaisse(),
                s.getDateHeureCloture(),
                s.getMontantCompte(),
                montantTheorique,
                ecart);
    }
}
