package com.saes.backend.web.dto;

import java.util.List;

import com.saes.backend.domain.TypeCommande;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

/**
 * Prendre une commande (cahier des charges §4.3) : sur place (table) ou a
 * emporter, dans le restaurant du serveur connecte.
 */
public record PrendreCommandeRequest(
        @NotNull TypeCommande type,
        Long tableId,
        @NotEmpty @Valid List<LigneDemandeeDto> lignes) {
}
