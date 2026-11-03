package com.saes.backend.web.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Faire une reservation (cahier des charges §4.4) : restaurant, date/heure,
 * nombre de couverts. La duree est fixee par le restaurant (regle 6), le
 * client ne la choisit pas. La plateforme choisit les tables (regle 7).
 */
public record FaireReservationRequest(
        @NotNull Long restaurantId,
        @NotNull @Future LocalDateTime dateHeure,
        @NotNull @Positive Integer nombreCouverts) {
}
