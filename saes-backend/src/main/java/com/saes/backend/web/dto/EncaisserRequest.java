package com.saes.backend.web.dto;

import com.saes.backend.domain.ModePaiement;

import jakarta.validation.constraints.NotNull;

public record EncaisserRequest(@NotNull ModePaiement modePaiement, @NotNull Long version) {
}
