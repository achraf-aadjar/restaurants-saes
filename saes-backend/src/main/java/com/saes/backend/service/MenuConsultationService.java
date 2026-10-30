package com.saes.backend.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.saes.backend.repository.MenuRepository;
import com.saes.backend.repository.RestaurantRepository;
import com.saes.backend.web.dto.MenuDto;
import com.saes.backend.web.dto.RestaurantSummaryDto;
import com.saes.backend.web.error.ApiException;

import lombok.RequiredArgsConstructor;

/**
 * Consulter les menus (cahier des charges §4.2) : accessible a toute
 * personne, meme sans compte.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MenuConsultationService {

    private final RestaurantRepository restaurantRepository;
    private final MenuRepository menuRepository;

    public List<RestaurantSummaryDto> listerRestaurantsActifs() {
        return restaurantRepository.findAll().stream()
                .filter(com.saes.backend.domain.Restaurant::isEstActif)
                .map(RestaurantSummaryDto::from)
                .toList();
    }

    public List<MenuDto> menusEnVigueur(Long restaurantId) {
        var restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> ApiException.notFound("Restaurant introuvable"));
        if (!restaurant.isEstActif()) {
            throw ApiException.notFound("Restaurant introuvable");
        }
        return menuRepository.findEnVigueur(restaurantId, LocalDate.now()).stream()
                .map(MenuDto::from)
                .toList();
    }
}
