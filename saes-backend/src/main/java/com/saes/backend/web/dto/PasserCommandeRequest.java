package com.saes.backend.web.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

/**
 * Passer une commande (cahier des charges §4.3) : en ligne, a emporter.
 */
public record PasserCommandeRequest(@NotNull Long restaurantId, @NotEmpty @Valid List<LigneDemandeeDto> lignes) {
}
