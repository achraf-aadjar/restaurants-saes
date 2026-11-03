package com.saes.backend.web.dto;

import java.util.List;

import com.saes.backend.domain.CategoriePlat;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

/**
 * Gerer les plats (cahier des charges §4.2) : nom, description (facultative),
 * prix, categorie, recette (au moins un ingredient).
 */
public record PlatSaveRequest(
        @NotBlank String nom,
        String description,
        @NotNull @PositiveOrZero Integer prix,
        @NotNull CategoriePlat categorie,
        @NotEmpty @Valid List<RecetteLigneDto> recette) {
}
