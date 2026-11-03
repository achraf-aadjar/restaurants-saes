package com.saes.backend.web.dto;

import java.util.List;

import com.saes.backend.domain.HoraireOuverture;
import com.saes.backend.domain.Restaurant;

/**
 * Vue publique minimale d'un restaurant (pour la liste consultable sans
 * compte, cahier des charges §3), avec ses horaires du jour et s'il est
 * ouvert en ce moment, comme sur l'ecran de reference 1.
 */
public record RestaurantSummaryDto(
        Long id,
        String nom,
        String adresse,
        String telephone,
        List<HoraireDto> horairesDuJour,
        boolean ouvert) {

    public static RestaurantSummaryDto from(Restaurant r, List<HoraireOuverture> plagesDuJour, boolean ouvert) {
        return new RestaurantSummaryDto(r.getId(), r.getNom(), r.getAdresse(), r.getTelephone(),
                plagesDuJour.stream().map(HoraireDto::from).toList(), ouvert);
    }
}
