package com.saes.backend.web.dto;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

/**
 * Gerer les menus (cahier des charges §4.2) : nom, date de debut, date de
 * fin (facultative), au moins un plat de ce restaurant.
 */
public record MenuSaveRequest(
        @NotBlank String nom,
        @NotNull LocalDate dateDebut,
        LocalDate dateFin,
        @NotEmpty List<Long> platIds) {
}
