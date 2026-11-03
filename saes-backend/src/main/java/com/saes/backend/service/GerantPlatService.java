package com.saes.backend.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.saes.backend.domain.Ingredient;
import com.saes.backend.domain.Plat;
import com.saes.backend.domain.Recette;
import com.saes.backend.domain.Restaurant;
import com.saes.backend.repository.IngredientRepository;
import com.saes.backend.repository.PlatRepository;
import com.saes.backend.web.dto.PlatGerantDto;
import com.saes.backend.web.dto.PlatSaveRequest;
import com.saes.backend.web.dto.RecetteLigneDto;
import com.saes.backend.web.error.ApiException;

import lombok.RequiredArgsConstructor;

/**
 * Gerer les plats (cahier des charges §4.2), reserve au gerant.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GerantPlatService {

    private final PlatRepository platRepository;
    private final IngredientRepository ingredientRepository;
    private final PersonnelRestaurantResolver personnelRestaurantResolver;

    public List<PlatGerantDto> lister(Long gerantId) {
        Restaurant restaurant = personnelRestaurantResolver.restaurantDe(gerantId);
        return platRepository.findByRestaurantId(restaurant.getId()).stream()
                .map(PlatGerantDto::from)
                .toList();
    }

    @Transactional
    public PlatGerantDto creer(Long gerantId, PlatSaveRequest request) {
        Restaurant restaurant = personnelRestaurantResolver.restaurantDe(gerantId);
        Plat plat = new Plat();
        plat.setRestaurant(restaurant);
        appliquer(plat, restaurant, request);
        return PlatGerantDto.from(platRepository.save(plat));
    }

    @Transactional
    public PlatGerantDto modifier(Long gerantId, Long platId, PlatSaveRequest request) {
        Restaurant restaurant = personnelRestaurantResolver.restaurantDe(gerantId);
        Plat plat = platDuRestaurant(platId, restaurant);
        appliquer(plat, restaurant, request);
        return PlatGerantDto.from(plat);
    }

    @Transactional
    public PlatGerantDto changerActivation(Long gerantId, Long platId, boolean actif) {
        Restaurant restaurant = personnelRestaurantResolver.restaurantDe(gerantId);
        Plat plat = platDuRestaurant(platId, restaurant);
        plat.setEstActif(actif);
        return PlatGerantDto.from(plat);
    }

    private void appliquer(Plat plat, Restaurant restaurant, PlatSaveRequest request) {
        plat.setNom(request.nom());
        plat.setDescription(request.description());
        plat.setPrix(request.prix());
        plat.setCategorie(request.categorie());

        Map<Long, RecetteLigneDto> demandees = new LinkedHashMap<>();
        for (RecetteLigneDto ligne : request.recette()) {
            if (demandees.putIfAbsent(ligne.ingredientId(), ligne) != null) {
                throw ApiException.badRequest("Un ingredient apparait deux fois dans la recette");
            }
        }

        // Mise a jour sur place : une ligne de recette est identifiee par (plat,
        // ingredient) ; la supprimer puis la recreer dans la meme transaction
        // ferait echouer Hibernate des que l'ingredient est conserve.
        plat.getRecette().removeIf(r -> !demandees.containsKey(r.getIngredient().getId()));
        for (RecetteLigneDto ligne : demandees.values()) {
            Recette existante = plat.getRecette().stream()
                    .filter(r -> r.getIngredient().getId().equals(ligne.ingredientId()))
                    .findFirst()
                    .orElse(null);
            if (existante != null) {
                existante.setQuantiteNecessaire(ligne.quantiteNecessaire());
                continue;
            }
            Ingredient ingredient = ingredientRepository.findById(ligne.ingredientId())
                    .orElseThrow(() -> ApiException.badRequest("Ingredient introuvable"));
            if (!ingredient.getRestaurant().getId().equals(restaurant.getId())) {
                throw ApiException.badRequest("Cet ingredient n'appartient pas a votre restaurant");
            }
            Recette recette = new Recette();
            recette.setPlat(plat);
            recette.setIngredient(ingredient);
            recette.setQuantiteNecessaire(ligne.quantiteNecessaire());
            plat.getRecette().add(recette);
        }
    }

    private Plat platDuRestaurant(Long platId, Restaurant restaurant) {
        Plat plat = platRepository.findById(platId)
                .orElseThrow(() -> ApiException.notFound("Plat introuvable"));
        if (!plat.getRestaurant().getId().equals(restaurant.getId())) {
            throw ApiException.forbidden("Ce plat n'appartient pas a votre restaurant");
        }
        return plat;
    }
}
