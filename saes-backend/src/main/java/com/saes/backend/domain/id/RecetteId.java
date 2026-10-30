package com.saes.backend.domain.id;

import java.io.Serializable;
import java.util.Objects;

public class RecetteId implements Serializable {

    private Long plat;
    private Long ingredient;

    public RecetteId() {
    }

    public RecetteId(Long plat, Long ingredient) {
        this.plat = plat;
        this.ingredient = ingredient;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof RecetteId that)) return false;
        return Objects.equals(plat, that.plat) && Objects.equals(ingredient, that.ingredient);
    }

    @Override
    public int hashCode() {
        return Objects.hash(plat, ingredient);
    }
}
