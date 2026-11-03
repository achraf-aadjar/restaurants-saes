package com.saes.backend.web.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public record ModifierCommandeRequest(
        @NotEmpty @Valid List<LigneDemandeeDto> lignes,
        @NotNull Long version) {
}
