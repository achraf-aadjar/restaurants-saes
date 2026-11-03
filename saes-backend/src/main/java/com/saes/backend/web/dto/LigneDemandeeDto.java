package com.saes.backend.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/** Une ligne demandee par le client/serveur : plat + quantite. */
public record LigneDemandeeDto(@NotNull Long platId, @NotNull @Positive Integer quantite) {
}
