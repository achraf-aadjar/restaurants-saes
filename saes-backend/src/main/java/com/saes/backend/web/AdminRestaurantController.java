package com.saes.backend.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.saes.backend.service.AdminRestaurantService;
import com.saes.backend.web.dto.RestaurantDto;
import com.saes.backend.web.dto.RestaurantSaveRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Gerer les restaurants (cahier des charges §4.7), reserve a
 * l'administrateur.
 */
@RestController
@RequestMapping("/api/admin/restaurants")
@RequiredArgsConstructor
public class AdminRestaurantController {

    private final AdminRestaurantService adminRestaurantService;

    @GetMapping
    public List<RestaurantDto> lister() {
        return adminRestaurantService.lister();
    }

    @GetMapping("/{id}")
    public RestaurantDto consulter(@PathVariable Long id) {
        return adminRestaurantService.consulter(id);
    }

    @PostMapping
    public ResponseEntity<RestaurantDto> creer(@Valid @RequestBody RestaurantSaveRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminRestaurantService.creer(request));
    }

    @PutMapping("/{id}")
    public RestaurantDto modifier(@PathVariable Long id, @Valid @RequestBody RestaurantSaveRequest request) {
        return adminRestaurantService.modifier(id, request);
    }

    @PutMapping("/{id}/activer")
    public RestaurantDto activer(@PathVariable Long id) {
        return adminRestaurantService.changerActivation(id, true);
    }

    @PutMapping("/{id}/desactiver")
    public RestaurantDto desactiver(@PathVariable Long id) {
        return adminRestaurantService.changerActivation(id, false);
    }
}
