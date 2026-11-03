package com.saes.backend.web.dto;

import java.math.BigDecimal;

import com.saes.backend.domain.TypeMouvement;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record MouvementStockRequest(
        @NotNull TypeMouvement type,
        @NotNull @DecimalMin(value = "0.0", inclusive = false) BigDecimal quantite) {
}
