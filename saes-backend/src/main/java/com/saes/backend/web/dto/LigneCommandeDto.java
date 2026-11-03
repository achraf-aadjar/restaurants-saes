package com.saes.backend.web.dto;

import com.saes.backend.domain.LigneCommande;

public record LigneCommandeDto(Long platId, String platNom, Integer quantite, Integer prixUnitaire) {

    public static LigneCommandeDto from(LigneCommande l) {
        return new LigneCommandeDto(l.getPlat().getId(), l.getPlat().getNom(), l.getQuantite(), l.getPrixUnitaire());
    }
}
