package com.saes.backend.web;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.saes.backend.service.MenuConsultationService;
import com.saes.backend.web.dto.MenuDto;
import com.saes.backend.web.dto.RestaurantSummaryDto;

import lombok.RequiredArgsConstructor;

/**
 * Consulter les menus (cahier des charges §4.2) : accessible sans compte
 * (SecurityConfig : /api/public/** -> permitAll).
 */
@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class MenuController {

    private final MenuConsultationService menuConsultationService;

    @GetMapping("/restaurants")
    public List<RestaurantSummaryDto> restaurants() {
        return menuConsultationService.listerRestaurantsActifs();
    }

    @GetMapping("/restaurants/{id}/menus")
    public List<MenuDto> menus(@PathVariable Long id) {
        return menuConsultationService.menusEnVigueur(id);
    }
}
