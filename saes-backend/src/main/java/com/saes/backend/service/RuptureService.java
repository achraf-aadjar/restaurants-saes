package com.saes.backend.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.saes.backend.domain.ActionJournal;
import com.saes.backend.domain.Ingredient;
import com.saes.backend.domain.MouvementStock;
import com.saes.backend.domain.Restaurant;
import com.saes.backend.domain.TypeMouvement;
import com.saes.backend.repository.IngredientRepository;
import com.saes.backend.repository.MouvementStockRepository;
import com.saes.backend.repository.PlatRepository;
import com.saes.backend.web.dto.IngredientDto;
import com.saes.backend.web.error.ApiException;

import lombok.RequiredArgsConstructor;

/**
 * Signaler une rupture (cahier des charges §4.6), cote cuisinier : les
 * plats qui contiennent l'ingredient sont desactives ; si le stock de
 * l'ingredient est superieur a zero, il est ramene a zero (le stock etant
 * calcule, ceci s'obtient par une sortie compensatoire).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RuptureService {

    private final IngredientRepository ingredientRepository;
    private final MouvementStockRepository mouvementStockRepository;
    private final PlatRepository platRepository;
    private final PersonnelRestaurantResolver personnelRestaurantResolver;
    private final JournalService journalService;

    /** Pour que le cuisinier choisisse l'ingredient en rupture (hypothese 4 du cahier des charges). */
    public List<IngredientDto> listerIngredients(Long cuisinierId) {
        Restaurant restaurant = personnelRestaurantResolver.restaurantDe(cuisinierId);
        return ingredientRepository.findByRestaurantId(restaurant.getId()).stream()
                .map(i -> IngredientDto.from(i, mouvementStockRepository.calculerStock(i.getId())))
                .toList();
    }

    @Transactional
    public void signaler(Long cuisinierId, Long ingredientId) {
        Restaurant restaurant = personnelRestaurantResolver.restaurantDe(cuisinierId);
        Ingredient ingredient = ingredientRepository.findById(ingredientId)
                .orElseThrow(() -> ApiException.notFound("Ingredient introuvable"));
        if (!ingredient.getRestaurant().getId().equals(restaurant.getId())) {
            throw ApiException.forbidden("Cet ingredient n'appartient pas a votre restaurant");
        }

        var plats = platRepository.findByRestaurantIdAndRecette_Ingredient_Id(restaurant.getId(), ingredientId);
        plats.forEach(plat -> plat.setEstActif(false));

        BigDecimal stock = mouvementStockRepository.calculerStock(ingredientId);
        if (stock.signum() > 0) {
            MouvementStock sortie = new MouvementStock();
            sortie.setIngredient(ingredient);
            sortie.setType(TypeMouvement.SORTIE);
            sortie.setQuantite(stock);
            sortie.setDateHeure(Instant.now());
            mouvementStockRepository.save(sortie);
        }
        journalService.enregistrer(ActionJournal.RUPTURE_SIGNALEE, "INGREDIENT", ingredientId,
                ingredient.getNom() + " : " + plats.size() + " plat(s) desactive(s), "
                        + (stock.signum() > 0 ? "stock de " + stock + " ramene a zero" : "stock inchange (" + stock + ")"));
    }
}
