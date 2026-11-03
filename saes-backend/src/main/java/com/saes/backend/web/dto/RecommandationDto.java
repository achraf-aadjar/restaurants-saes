package com.saes.backend.web.dto;

import java.math.BigDecimal;

import com.saes.backend.domain.Unite;

public record RecommandationDto(
        Long ingredientId,
        String nom,
        Unite unite,
        BigDecimal stock,
        BigDecimal niveauCible,
        BigDecimal quantiteARecommander,
        BigDecimal consommationMoyenneParSemaine) {
}
