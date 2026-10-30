package com.saes.backend.domain;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Le stock n'est pas un champ enregistre : il se calcule a partir des
 * MouvementStock (regle 10 du cahier des charges). Voir
 * IngredientRepository / StockService pour le calcul de quantiteEnStock.
 */
@Entity
@Table(name = "ingredient")
@Getter
@Setter
@NoArgsConstructor
public class Ingredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Column(nullable = false, length = 150)
    private String nom;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private Unite unite;

    @Column(name = "seuil_alerte", nullable = false, precision = 12, scale = 3)
    private BigDecimal seuilAlerte;

    @Column(name = "niveau_cible", nullable = false, precision = 12, scale = 3)
    private BigDecimal niveauCible;
}
