package com.saes.backend.web.dto;

import com.saes.backend.domain.CategoriePlat;
import com.saes.backend.domain.Plat;

public record PlatDto(Long id, String nom, String description, Integer prix, CategoriePlat categorie) {

    public static PlatDto from(Plat p) {
        return new PlatDto(p.getId(), p.getNom(), p.getDescription(), p.getPrix(), p.getCategorie());
    }
}
