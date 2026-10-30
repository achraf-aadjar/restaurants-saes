package com.saes.backend.repository;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.saes.backend.domain.MouvementStock;

public interface MouvementStockRepository extends JpaRepository<MouvementStock, Long> {

    List<MouvementStock> findByIngredientId(Long ingredientId);

    /**
     * Stock calcule : total des entrees moins total des sorties (regle 10 du
     * cahier des charges). Peut devenir nul ou negatif.
     */
    @Query("""
            select coalesce(sum(case when m.type = com.saes.backend.domain.TypeMouvement.ENTREE
                                      then m.quantite else -m.quantite end), 0)
            from MouvementStock m
            where m.ingredient.id = :ingredientId
            """)
    BigDecimal calculerStock(@Param("ingredientId") Long ingredientId);
}
