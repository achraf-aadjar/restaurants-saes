package com.saes.backend.service;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.saes.backend.domain.Ingredient;
import com.saes.backend.domain.MouvementStock;
import com.saes.backend.domain.Restaurant;
import com.saes.backend.repository.IngredientRepository;
import com.saes.backend.repository.MouvementStockRepository;
import com.saes.backend.web.dto.IngredientDto;
import com.saes.backend.web.dto.IngredientSaveRequest;
import com.saes.backend.web.dto.MouvementStockRequest;
import com.saes.backend.web.error.ApiException;

import lombok.RequiredArgsConstructor;

/**
 * Gerer les stocks (cahier des charges §4.6), reserve au gerant. Le stock
 * n'est pas un champ enregistre : il est calcule a partir des mouvements
 * (regle 10) ; il peut devenir nul ou negatif, ce qui ne bloque pas les
 * commandes.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GerantStockService {

    private final IngredientRepository ingredientRepository;
    private final MouvementStockRepository mouvementStockRepository;
    private final PersonnelRestaurantResolver personnelRestaurantResolver;

    public List<IngredientDto> lister(Long gerantId) {
        Restaurant restaurant = personnelRestaurantResolver.restaurantDe(gerantId);
        return ingredientRepository.findByRestaurantId(restaurant.getId()).stream()
                .map(i -> IngredientDto.from(i, mouvementStockRepository.calculerStock(i.getId())))
                .toList();
    }

    @Transactional
    public IngredientDto creer(Long gerantId, IngredientSaveRequest request) {
        Restaurant restaurant = personnelRestaurantResolver.restaurantDe(gerantId);
        valider(request);
        Ingredient ingredient = new Ingredient();
        ingredient.setRestaurant(restaurant);
        appliquer(ingredient, request);
        ingredient = ingredientRepository.save(ingredient);
        return IngredientDto.from(ingredient, mouvementStockRepository.calculerStock(ingredient.getId()));
    }

    @Transactional
    public IngredientDto modifier(Long gerantId, Long ingredientId, IngredientSaveRequest request) {
        Restaurant restaurant = personnelRestaurantResolver.restaurantDe(gerantId);
        valider(request);
        Ingredient ingredient = ingredientDuRestaurant(ingredientId, restaurant);
        appliquer(ingredient, request);
        return IngredientDto.from(ingredient, mouvementStockRepository.calculerStock(ingredient.getId()));
    }

    @Transactional
    public IngredientDto enregistrerMouvement(Long gerantId, Long ingredientId, MouvementStockRequest request) {
        Restaurant restaurant = personnelRestaurantResolver.restaurantDe(gerantId);
        Ingredient ingredient = ingredientDuRestaurant(ingredientId, restaurant);

        MouvementStock mouvement = new MouvementStock();
        mouvement.setIngredient(ingredient);
        mouvement.setType(request.type());
        mouvement.setQuantite(request.quantite());
        mouvement.setDateHeure(Instant.now());
        mouvementStockRepository.save(mouvement);

        return IngredientDto.from(ingredient, mouvementStockRepository.calculerStock(ingredient.getId()));
    }

    private void valider(IngredientSaveRequest request) {
        if (request.niveauCible().compareTo(request.seuilAlerte()) < 0) {
            throw ApiException.badRequest("Le niveau cible ne peut pas être inférieur au seuil d'alerte");
        }
    }

    private void appliquer(Ingredient ingredient, IngredientSaveRequest request) {
        ingredient.setNom(request.nom());
        ingredient.setUnite(request.unite());
        ingredient.setSeuilAlerte(request.seuilAlerte());
        ingredient.setNiveauCible(request.niveauCible());
    }

    private Ingredient ingredientDuRestaurant(Long ingredientId, Restaurant restaurant) {
        Ingredient ingredient = ingredientRepository.findById(ingredientId)
                .orElseThrow(() -> ApiException.notFound("Ingrédient introuvable"));
        if (!ingredient.getRestaurant().getId().equals(restaurant.getId())) {
            throw ApiException.forbidden("Cet ingrédient n'appartient pas à votre restaurant");
        }
        return ingredient;
    }
}
