package com.saes.backend.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record OuvrirCaisseRequest(@NotNull @PositiveOrZero Integer fondDeCaisse) {
}
