package com.saes.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.saes.backend.domain.Plat;

public interface PlatRepository extends JpaRepository<Plat, Long> {

    List<Plat> findByRestaurantId(Long restaurantId);

    /** Plats dont la recette contient cet ingredient (Signaler une rupture, §4.6). */
    List<Plat> findByRestaurantIdAndRecette_Ingredient_Id(Long restaurantId, Long ingredientId);
}
