package com.saes.backend.web.dto;

import com.saes.backend.domain.CategoriePlat;

public record VenteParPlatDto(Long platId, String nom, CategoriePlat categorie, int quantiteVendue, int montant) {
}
