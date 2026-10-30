package com.saes.backend.web.dto;

import com.saes.backend.domain.TableRestaurant;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record TableDto(Long id, @NotNull @Positive Integer numero, @NotNull @Positive Integer capacite) {

    public static TableDto from(TableRestaurant t) {
        return new TableDto(t.getId(), t.getNumero(), t.getCapacite());
    }
}
