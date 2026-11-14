package com.saes.backend.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.springframework.stereotype.Component;

import com.saes.backend.domain.TableRestaurant;

/**
 * Regle 7 du cahier des charges : la plateforme choisit les tables libres
 * qui laissent le moins de places inutilisees et, a egalite, le moins de
 * tables.
 *
 * <p>Calcul exact quel que soit le nombre de tables (programmation dynamique
 * sur le nombre de places) : pour chaque total de places atteignable, on
 * retient le plus petit nombre de tables qui l'atteint, puis on prend le plus
 * petit total qui couvre les couverts. Cout : tables x places, au lieu de 2^tables.
 */
@Component
class TableSelectionService {

    private static final int INATTEIGNABLE = Integer.MAX_VALUE;

    List<TableRestaurant> choisir(List<TableRestaurant> tablesLibres, int couverts) {
        int n = tablesLibres.size();
        if (n == 0) {
            return List.of();
        }
        // Un choix optimal depasse les couverts de moins que sa plus petite table
        // (sinon on pourrait l'enlever) : inutile de regarder au-dela de cette borne.
        int plusGrandeTable = tablesLibres.stream().mapToInt(TableRestaurant::getCapacite).max().orElse(0);
        int totalLibre = tablesLibres.stream().mapToInt(TableRestaurant::getCapacite).sum();
        int borne = Math.min(totalLibre, couverts + plusGrandeTable - 1);
        if (borne < couverts) {
            return List.of();
        }

        // minTables[s] : plus petit nombre de tables totalisant exactement s places.
        int[] minTables = new int[borne + 1];
        Arrays.fill(minTables, INATTEIGNABLE);
        minTables[0] = 0;
        // prise[i][s] : la table i fait partie du meilleur choix pour s avec les tables 0..i.
        boolean[][] prise = new boolean[n][borne + 1];
        for (int i = 0; i < n; i++) {
            int capacite = tablesLibres.get(i).getCapacite();
            for (int s = borne; s >= capacite; s--) {
                int avant = minTables[s - capacite];
                if (avant != INATTEIGNABLE && avant + 1 < minTables[s]) {
                    minTables[s] = avant + 1;
                    prise[i][s] = true;
                }
            }
        }

        int total = couverts;
        while (total <= borne && minTables[total] == INATTEIGNABLE) {
            total++;
        }
        if (total > borne) {
            return List.of();
        }

        List<TableRestaurant> resultat = new ArrayList<>();
        for (int i = n - 1; i >= 0 && total > 0; i--) {
            if (prise[i][total]) {
                resultat.add(tablesLibres.get(i));
                total -= tablesLibres.get(i).getCapacite();
            }
        }
        return resultat;
    }
}
