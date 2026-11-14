package com.saes.backend.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.saes.backend.domain.TableRestaurant;

/** Regle 7 : le moins de places inutilisees, puis le moins de tables, quel que soit le nombre de tables. */
class TableSelectionServiceTest {

    private final TableSelectionService service = new TableSelectionService();

    @Test
    void laisseLeMoinsDePlacesVidesMemeAvecBeaucoupDeTables() {
        // 25 tables de 4 et une de 6 : pour 5 couverts, la table de 6 (1 place vide), pas 4 + 4 (3).
        List<TableRestaurant> tables = tables(25, 4);
        tables.add(table(26, 6));

        assertThat(numeros(service.choisir(tables, 5))).containsExactly(26);
    }

    @Test
    void aEgaliteDePlacesVidesPrendLeMoinsDeTables() {
        // 30 tables de 2 et une de 8 : pour 8 couverts, la table de 8, pas quatre tables de 2.
        List<TableRestaurant> tables = tables(30, 2);
        tables.add(table(31, 8));

        assertThat(numeros(service.choisir(tables, 8))).containsExactly(31);
    }

    @Test
    void assembleDesTablesQuandAucuneNeSuffitSeule() {
        List<TableRestaurant> tables = List.of(table(1, 2), table(2, 4), table(3, 6));

        assertThat(numeros(service.choisir(tables, 9))).containsExactlyInAnyOrder(2, 3);
        assertThat(service.choisir(tables, 13)).isEmpty();
    }

    private static List<TableRestaurant> tables(int nombre, int capacite) {
        List<TableRestaurant> tables = new ArrayList<>();
        for (int numero = 1; numero <= nombre; numero++) {
            tables.add(table(numero, capacite));
        }
        return tables;
    }

    private static TableRestaurant table(int numero, int capacite) {
        TableRestaurant table = new TableRestaurant();
        table.setNumero(numero);
        table.setCapacite(capacite);
        return table;
    }

    private static List<Integer> numeros(List<TableRestaurant> tables) {
        return tables.stream().map(TableRestaurant::getNumero).toList();
    }
}
