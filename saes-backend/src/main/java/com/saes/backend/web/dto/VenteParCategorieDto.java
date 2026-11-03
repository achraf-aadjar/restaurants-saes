package com.saes.backend.web.dto;

import com.saes.backend.domain.CategoriePlat;

public record VenteParCategorieDto(CategoriePlat categorie, int quantiteVendue, int montant) {
}
