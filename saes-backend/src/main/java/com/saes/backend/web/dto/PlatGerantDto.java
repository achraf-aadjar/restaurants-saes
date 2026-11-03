package com.saes.backend.web.dto;

import java.util.List;

import com.saes.backend.domain.CategoriePlat;
import com.saes.backend.domain.Plat;

public record PlatGerantDto(
        Long id,
        String nom,
        String description,
        Integer prix,
        CategoriePlat categorie,
        boolean estActif,
        List<RecetteLigneDto> recette) {

    public static PlatGerantDto from(Plat p) {
        return new PlatGerantDto(
                p.getId(),
                p.getNom(),
                p.getDescription(),
                p.getPrix(),
                p.getCategorie(),
                p.isEstActif(),
                p.getRecette().stream().map(RecetteLigneDto::from).toList());
    }
}
