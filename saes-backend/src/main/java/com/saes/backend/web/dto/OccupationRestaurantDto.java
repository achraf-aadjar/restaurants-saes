package com.saes.backend.web.dto;

import java.util.List;

/**
 * Visualiser l'occupation des tables (cahier des charges §4.3) : les tables
 * occupees et les reservations confirmees du jour, dans le restaurant du
 * serveur connecte.
 */
public record OccupationRestaurantDto(List<TableOccupationDto> tables, List<ReservationDto> reservationsDuJour) {
}
