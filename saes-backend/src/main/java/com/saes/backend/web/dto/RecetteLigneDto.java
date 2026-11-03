package com.saes.backend.web.dto;

import java.math.BigDecimal;

import com.saes.backend.domain.Recette;
import com.saes.backend.domain.Unite;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record RecetteLigneDto(
        @NotNull Long ingredientId,
        String ingredientNom,
        Unite unite,
        @NotNull @DecimalMin(value = "0.0", inclusive = false) BigDecimal quantiteNecessaire) {

    public static RecetteLigneDto from(Recette r) {
        return new RecetteLigneDto(
                r.getIngredient().getId(),
                r.getIngredient().getNom(),
                r.getIngredient().getUnite(),
                r.getQuantiteNecessaire());
    }
}
