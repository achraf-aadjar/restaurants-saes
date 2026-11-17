package com.saes.backend.service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.saes.backend.domain.Menu;
import com.saes.backend.domain.Plat;
import com.saes.backend.domain.Restaurant;
import com.saes.backend.repository.MenuRepository;
import com.saes.backend.repository.PlatRepository;
import com.saes.backend.web.dto.MenuGerantDto;
import com.saes.backend.web.dto.MenuSaveRequest;
import com.saes.backend.web.error.ApiException;

import lombok.RequiredArgsConstructor;

/**
 * Gerer les menus (cahier des charges §4.2), reserve au gerant.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GerantMenuService {

    private final MenuRepository menuRepository;
    private final PlatRepository platRepository;
    private final PersonnelRestaurantResolver personnelRestaurantResolver;

    public List<MenuGerantDto> lister(Long gerantId) {
        Restaurant restaurant = personnelRestaurantResolver.restaurantDe(gerantId);
        return menuRepository.findByRestaurantId(restaurant.getId()).stream()
                .map(MenuGerantDto::from)
                .toList();
    }

    @Transactional
    public MenuGerantDto creer(Long gerantId, MenuSaveRequest request) {
        Restaurant restaurant = personnelRestaurantResolver.restaurantDe(gerantId);
        Menu menu = new Menu();
        menu.setRestaurant(restaurant);
        appliquer(menu, restaurant, request);
        return MenuGerantDto.from(menuRepository.save(menu));
    }

    @Transactional
    public MenuGerantDto modifier(Long gerantId, Long menuId, MenuSaveRequest request) {
        Restaurant restaurant = personnelRestaurantResolver.restaurantDe(gerantId);
        Menu menu = menuRepository.findById(menuId)
                .orElseThrow(() -> ApiException.notFound("Menu introuvable"));
        if (!menu.getRestaurant().getId().equals(restaurant.getId())) {
            throw ApiException.forbidden("Ce menu n'appartient pas à votre restaurant");
        }
        appliquer(menu, restaurant, request);
        return MenuGerantDto.from(menu);
    }

    private void appliquer(Menu menu, Restaurant restaurant, MenuSaveRequest request) {
        if (request.dateFin() != null && request.dateFin().isBefore(request.dateDebut())) {
            throw ApiException.badRequest("La date de fin ne peut pas être avant la date de début");
        }

        menu.setNom(request.nom());
        menu.setDateDebut(request.dateDebut());
        menu.setDateFin(request.dateFin());

        Set<Plat> plats = new HashSet<>();
        for (Long platId : request.platIds()) {
            Plat plat = platRepository.findById(platId)
                    .orElseThrow(() -> ApiException.badRequest("Plat introuvable"));
            if (!plat.getRestaurant().getId().equals(restaurant.getId())) {
                throw ApiException.badRequest("Ce plat n'appartient pas à votre restaurant");
            }
            plats.add(plat);
        }
        menu.setPlats(plats);
    }
}
