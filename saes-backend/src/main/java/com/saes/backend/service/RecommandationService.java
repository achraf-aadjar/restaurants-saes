package com.saes.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.saes.backend.domain.Ingredient;
import com.saes.backend.domain.Restaurant;
import com.saes.backend.repository.IngredientRepository;
import com.saes.backend.repository.MouvementStockRepository;
import com.saes.backend.web.dto.RecommandationDto;

import lombok.RequiredArgsConstructor;

/**
 * Consulter les recommandations d'approvisionnement (cahier des charges
 * §4.6). Regle 11 : quantite = niveau cible - stock (un stock negatif
 * compte pour zero), affichee seulement si positive.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecommandationService {

    private static final int JOURS_HISTORIQUE = 28;
    private static final BigDecimal SEMAINES = BigDecimal.valueOf(JOURS_HISTORIQUE / 7.0);

    private final IngredientRepository ingredientRepository;
    private final MouvementStockRepository mouvementStockRepository;
    private final PersonnelRestaurantResolver personnelRestaurantResolver;

    public List<RecommandationDto> lister(Long gerantId) {
        Restaurant restaurant = personnelRestaurantResolver.restaurantDe(gerantId);
        Instant depuis = Instant.now().minus(JOURS_HISTORIQUE, ChronoUnit.DAYS);

        return ingredientRepository.findByRestaurantId(restaurant.getId()).stream()
                .map(ingredient -> construire(ingredient, depuis))
                .filter(dto -> dto.quantiteARecommander().signum() > 0)
                .toList();
    }

    private RecommandationDto construire(Ingredient ingredient, Instant depuis) {
        BigDecimal stock = mouvementStockRepository.calculerStock(ingredient.getId());
        BigDecimal stockPourCalcul = stock.max(BigDecimal.ZERO);
        BigDecimal quantite = ingredient.getNiveauCible().subtract(stockPourCalcul);

        BigDecimal sorties28Jours = mouvementStockRepository.calculerSortiesDepuis(ingredient.getId(), depuis);
        BigDecimal consommationParSemaine = sorties28Jours.divide(SEMAINES, 3, RoundingMode.HALF_UP);

        return new RecommandationDto(
                ingredient.getId(),
                ingredient.getNom(),
                ingredient.getUnite(),
                stock,
                ingredient.getNiveauCible(),
                quantite,
                consommationParSemaine);
    }
}
