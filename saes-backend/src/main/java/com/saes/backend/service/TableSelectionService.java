package com.saes.backend.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Component;

import com.saes.backend.domain.TableRestaurant;

/**
 * Regle 7 du cahier des charges : la plateforme choisit les tables libres
 * qui laissent le moins de places inutilisees et, a egalite, le moins de
 * tables.
 */
@Component
class TableSelectionService {

    /** Au-dela, la recherche exhaustive (2^n) devient trop couteuse : repli glouton. */
    private static final int LIMITE_RECHERCHE_EXHAUSTIVE = 22;

    List<TableRestaurant> choisir(List<TableRestaurant> tablesLibres, int couverts) {
        if (tablesLibres.isEmpty()) {
            return List.of();
        }
        return tablesLibres.size() <= LIMITE_RECHERCHE_EXHAUSTIVE
                ? choisirExhaustif(tablesLibres, couverts)
                : choisirGlouton(tablesLibres, couverts);
    }

    private List<TableRestaurant> choisirExhaustif(List<TableRestaurant> tables, int couverts) {
        int n = tables.size();
        long meilleurMasque = -1;
        int meilleurPlacesInutilisees = Integer.MAX_VALUE;
        int meilleurNombreTables = Integer.MAX_VALUE;

        for (long masque = 1; masque < (1L << n); masque++) {
            int somme = 0;
            int nbTables = 0;
            for (int i = 0; i < n; i++) {
                if ((masque & (1L << i)) != 0) {
                    somme += tables.get(i).getCapacite();
                    nbTables++;
                }
            }
            if (somme < couverts) {
                continue;
            }
            int placesInutilisees = somme - couverts;
            if (placesInutilisees < meilleurPlacesInutilisees
                    || (placesInutilisees == meilleurPlacesInutilisees && nbTables < meilleurNombreTables)) {
                meilleurPlacesInutilisees = placesInutilisees;
                meilleurNombreTables = nbTables;
                meilleurMasque = masque;
            }
        }

        if (meilleurMasque < 0) {
            return List.of();
        }
        List<TableRestaurant> resultat = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            if ((meilleurMasque & (1L << i)) != 0) {
                resultat.add(tables.get(i));
            }
        }
        return resultat;
    }

    /** Repli pour un tres grand nombre de tables : pas garanti optimal, mais evite l'explosion combinatoire. */
    private List<TableRestaurant> choisirGlouton(List<TableRestaurant> tables, int couverts) {
        List<TableRestaurant> triees = tables.stream()
                .sorted(Comparator.comparingInt(TableRestaurant::getCapacite))
                .toList();
        List<TableRestaurant> resultat = new ArrayList<>();
        int somme = 0;
        for (TableRestaurant t : triees) {
            if (somme >= couverts) {
                break;
            }
            resultat.add(t);
            somme += t.getCapacite();
        }
        return somme >= couverts ? resultat : List.of();
    }
}
