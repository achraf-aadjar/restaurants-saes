package com.saes.backend.web.dto;

import java.util.List;

import com.saes.backend.domain.Restaurant;

public record RestaurantDto(
        Long id,
        String nom,
        String adresse,
        String telephone,
        Integer dureeReservationMinutes,
        boolean estActif,
        List<TableDto> tables,
        List<HoraireDto> horaires) {

    public static RestaurantDto from(Restaurant r) {
        return new RestaurantDto(
                r.getId(),
                r.getNom(),
                r.getAdresse(),
                r.getTelephone(),
                r.getDureeReservationMinutes(),
                r.isEstActif(),
                r.getTables().stream().map(TableDto::from).toList(),
                r.getHoraires().stream().map(HoraireDto::from).toList());
    }
}
