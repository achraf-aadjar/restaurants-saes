package com.saes.backend.web.dto;

import java.math.BigDecimal;

import com.saes.backend.domain.Ingredient;
import com.saes.backend.domain.Unite;

public record IngredientDto(
        Long id,
        String nom,
        Unite unite,
        BigDecimal seuilAlerte,
        BigDecimal niveauCible,
        BigDecimal stock,
        boolean alerte) {

    public static IngredientDto from(Ingredient i, BigDecimal stock) {
        boolean alerte = stock.compareTo(i.getSeuilAlerte()) <= 0;
        return new IngredientDto(i.getId(), i.getNom(), i.getUnite(), i.getSeuilAlerte(), i.getNiveauCible(), stock, alerte);
    }
}
