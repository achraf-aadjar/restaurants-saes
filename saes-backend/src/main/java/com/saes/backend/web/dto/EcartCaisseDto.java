package com.saes.backend.web.dto;

import java.time.Instant;

import com.saes.backend.domain.SessionCaisse;

public record EcartCaisseDto(
        Long sessionId,
        String caissierNom,
        Instant dateHeureOuverture,
        Instant dateHeureCloture,
        int fondDeCaisse,
        int montantTheorique,
        int montantCompte,
        int ecart) {

    public static EcartCaisseDto from(SessionCaisse session, int montantTheorique) {
        int montantCompte = session.getMontantCompte();
        return new EcartCaisseDto(
                session.getId(),
                session.getCaissier().getNom() + " " + session.getCaissier().getPrenom(),
                session.getDateHeureOuverture(),
                session.getDateHeureCloture(),
                session.getFondDeCaisse(),
                montantTheorique,
                montantCompte,
                montantCompte - montantTheorique);
    }
}
