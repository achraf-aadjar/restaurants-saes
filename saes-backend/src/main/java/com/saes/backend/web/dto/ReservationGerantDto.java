package com.saes.backend.web.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.saes.backend.domain.Reservation;
import com.saes.backend.domain.Utilisateur;

/**
 * Une reservation vue par le gerant de son restaurant : quand, combien de
 * couverts, quelles tables, et qui joindre (nom, e-mail, telephone s'il a ete
 * donne). Rien d'autre sur le client : seulement ce qu'il faut pour l'accueillir
 * ou le prevenir (loi 2008-12, art. 35 : donnees adequates, pertinentes et non
 * excessives au regard de la finalite).
 */
public record ReservationGerantDto(
        Long id,
        LocalDateTime dateHeure,
        Integer dureeMinutes,
        Integer nombreCouverts,
        List<TableDto> tables,
        String clientNom,
        String clientPrenom,
        String clientEmail,
        String clientTelephone) {

    public static ReservationGerantDto from(Reservation r) {
        Utilisateur client = r.getClient();
        return new ReservationGerantDto(
                r.getId(),
                r.getDateHeure(),
                r.getDureeMinutes(),
                r.getNombreCouverts(),
                r.getTables().stream().map(rt -> TableDto.from(rt.getTable())).toList(),
                client.getNom(),
                client.getPrenom(),
                client.getEmail(),
                client.getTelephone());
    }
}
