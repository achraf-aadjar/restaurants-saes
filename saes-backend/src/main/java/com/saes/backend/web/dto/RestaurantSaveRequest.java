package com.saes.backend.web.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Gerer les restaurants (cahier des charges §4.7) : nom, adresse, telephone,
 * duree de reservation, tables (au moins une), horaires (au moins une plage
 * dans la semaine).
 */
public record RestaurantSaveRequest(
        @NotBlank String nom,
        @NotBlank String adresse,
        String telephone,
        @NotNull @Positive Integer dureeReservationMinutes,
        @NotEmpty @Valid List<TableDto> tables,
        @NotEmpty @Valid List<HoraireDto> horaires) {
}
