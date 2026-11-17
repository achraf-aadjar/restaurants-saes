package com.saes.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.saes.backend.domain.Ingredient;

public interface IngredientRepository extends JpaRepository<Ingredient, Long> {

    List<Ingredient> findByRestaurantId(Long restaurantId);

    boolean existsByRestaurantIdAndNom(Long restaurantId, String nom);

    boolean existsByRestaurantIdAndNomAndIdNot(Long restaurantId, String nom, Long id);
}
