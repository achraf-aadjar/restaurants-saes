package com.saes.backend.web.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.saes.backend.domain.Reservation;
import com.saes.backend.domain.StatutReservation;

public record ReservationDto(
        Long id,
        Long restaurantId,
        String restaurantNom,
        LocalDateTime dateHeure,
        Integer dureeMinutes,
        Integer nombreCouverts,
        StatutReservation statut,
        List<TableDto> tables) {

    public static ReservationDto from(Reservation r) {
        return new ReservationDto(
                r.getId(),
                r.getRestaurant().getId(),
                r.getRestaurant().getNom(),
                r.getDateHeure(),
                r.getDureeMinutes(),
                r.getNombreCouverts(),
                r.getStatut(),
                r.getTables().stream().map(rt -> TableDto.from(rt.getTable())).toList());
    }
}
