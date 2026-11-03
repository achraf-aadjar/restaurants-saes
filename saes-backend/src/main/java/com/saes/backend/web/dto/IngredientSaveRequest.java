package com.saes.backend.web.dto;

import java.math.BigDecimal;

import com.saes.backend.domain.Unite;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Gerer les stocks (cahier des charges §4.6) : nom, unite, seuil d'alerte,
 * niveau cible. Regle 18 : le niveau cible n'est pas inferieur au seuil
 * d'alerte.
 */
public record IngredientSaveRequest(
        @NotBlank String nom,
        @NotNull Unite unite,
        @NotNull @DecimalMin(value = "0.0") BigDecimal seuilAlerte,
        @NotNull @DecimalMin(value = "0.0") BigDecimal niveauCible) {
}
