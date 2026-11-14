package com.saes.backend;

import static com.saes.backend.support.Monde.ok;
import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.saes.backend.support.IntegrationTest;

/** Consulter les menus (cahier des charges §4.2) et Gerer les menus (§4.2). */
class MenusTest extends IntegrationTest {

    @Test
    void lesPlatsDUnMenuSortentToujoursDansLOrdreDeLeurCreation() {
        List<Long> crees = new ArrayList<>();
        for (int i = 1; i <= 6; i++) {
            crees.add(monde.creerPlat("Plat " + i, 1000 + i, "PLAT_PRINCIPAL", monde.rizId, 0.1));
        }
        List<Long> melanges = new ArrayList<>(crees);
        Collections.reverse(melanges);
        long menu = ok(api.post(monde.jetonGerant, "/api/gerant/menus", Map.of(
                "nom", "Menu ordonne",
                "dateDebut", LocalDate.now().toString(),
                "platIds", melanges))).id();

        List<Object> attendus = crees.stream().map(Long::intValue).map(Object.class::cast).toList();
        String filtre = "$[?(@.id == " + menu + ")].plats[*].id";
        assertThat(api.get(null, "/api/public/restaurants/" + monde.restaurantId + "/menus").liste(filtre))
                .containsExactlyElementsOf(attendus);
        assertThat(api.get(monde.jetonGerant, "/api/gerant/menus").liste(filtre))
                .containsExactlyElementsOf(attendus);
    }
}
