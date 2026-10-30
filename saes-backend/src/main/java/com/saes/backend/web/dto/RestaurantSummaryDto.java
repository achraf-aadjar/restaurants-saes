package com.saes.backend.web.dto;

import com.saes.backend.domain.Restaurant;

/**
 * Vue publique minimale d'un restaurant (pour la liste consultable sans
 * compte, cahier des charges §3).
 */
public record RestaurantSummaryDto(Long id, String nom, String adresse, String telephone) {

    public static RestaurantSummaryDto from(Restaurant r) {
        return new RestaurantSummaryDto(r.getId(), r.getNom(), r.getAdresse(), r.getTelephone());
    }
}
