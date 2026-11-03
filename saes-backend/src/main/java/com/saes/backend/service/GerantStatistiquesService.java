package com.saes.backend.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.saes.backend.domain.CategoriePlat;
import com.saes.backend.domain.Commande;
import com.saes.backend.domain.LigneCommande;
import com.saes.backend.domain.Plat;
import com.saes.backend.domain.Restaurant;
import com.saes.backend.domain.StatutCommande;
import com.saes.backend.repository.CommandeRepository;
import com.saes.backend.web.dto.StatistiquesVentesDto;
import com.saes.backend.web.dto.VenteParCategorieDto;
import com.saes.backend.web.dto.VenteParPlatDto;

import lombok.RequiredArgsConstructor;

/**
 * Consulter les statistiques de ventes (cahier des charges §4.6), reserve
 * au gerant : nombre de commandes payees et montant moyen, quantites
 * vendues et montants par plat et par categorie, sur une periode.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GerantStatistiquesService {

    private static final ZoneId ZONE = ZoneId.systemDefault();

    private final CommandeRepository commandeRepository;
    private final PersonnelRestaurantResolver personnelRestaurantResolver;

    public StatistiquesVentesDto consulter(Long gerantId, LocalDate debut, LocalDate fin) {
        Restaurant restaurant = personnelRestaurantResolver.restaurantDe(gerantId);
        Instant debutInstant = debut.atStartOfDay(ZONE).toInstant();
        Instant finInstant = fin.plusDays(1).atStartOfDay(ZONE).toInstant();

        List<Commande> commandesPayees = commandeRepository.findByRestaurantIdAndStatutAndDateHeureBetween(
                restaurant.getId(), StatutCommande.PAYEE, debutInstant, finInstant);

        int nombreCommandesPayees = commandesPayees.size();
        int montantTotal = commandesPayees.stream().mapToInt(this::montant).sum();
        double montantMoyen = nombreCommandesPayees == 0 ? 0 : (double) montantTotal / nombreCommandesPayees;

        record Agregat(String nom, CategoriePlat categorie, int quantite, int montant) {
            Agregat plus(int quantite, int montant) {
                return new Agregat(nom, categorie, this.quantite + quantite, this.montant + montant);
            }
        }

        Map<Long, Agregat> parPlat = new LinkedHashMap<>();
        for (Commande commande : commandesPayees) {
            for (LigneCommande ligne : commande.getLignes()) {
                Plat plat = ligne.getPlat();
                int montantLigne = ligne.getPrixUnitaire() * ligne.getQuantite();
                parPlat.merge(
                        plat.getId(),
                        new Agregat(plat.getNom(), plat.getCategorie(), ligne.getQuantite(), montantLigne),
                        (existant, nouveau) -> existant.plus(nouveau.quantite(), nouveau.montant()));
            }
        }

        List<VenteParPlatDto> ventesParPlat = parPlat.entrySet().stream()
                .map(e -> new VenteParPlatDto(e.getKey(), e.getValue().nom(), e.getValue().categorie(),
                        e.getValue().quantite(), e.getValue().montant()))
                .toList();

        Map<CategoriePlat, int[]> parCategorie = new LinkedHashMap<>();
        for (Agregat agregat : parPlat.values()) {
            int[] totaux = parCategorie.computeIfAbsent(agregat.categorie(), c -> new int[2]);
            totaux[0] += agregat.quantite();
            totaux[1] += agregat.montant();
        }
        List<VenteParCategorieDto> ventesParCategorie = parCategorie.entrySet().stream()
                .map(e -> new VenteParCategorieDto(e.getKey(), e.getValue()[0], e.getValue()[1]))
                .toList();

        return new StatistiquesVentesDto(nombreCommandesPayees, montantMoyen, ventesParPlat, ventesParCategorie);
    }

    private int montant(Commande commande) {
        return commande.getLignes().stream().mapToInt(l -> l.getPrixUnitaire() * l.getQuantite()).sum();
    }
}
