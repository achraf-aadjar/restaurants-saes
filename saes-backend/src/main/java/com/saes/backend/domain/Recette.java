package com.saes.backend.domain;

import java.math.BigDecimal;

import com.saes.backend.domain.id.RecetteId;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Classe-association Plat <-> Ingredient : la quantite necessaire
 * n'appartient ni au plat ni a l'ingredient seuls (support_comprehension_conception.pdf).
 */
@Entity
@Table(name = "recette")
@IdClass(RecetteId.class)
@Getter
@Setter
@NoArgsConstructor
public class Recette {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plat_id")
    private Plat plat;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ingredient_id")
    private Ingredient ingredient;

    @Column(name = "quantite_necessaire", nullable = false, precision = 12, scale = 3)
    private BigDecimal quantiteNecessaire;
}
