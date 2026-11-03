package com.saes.backend.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.saes.backend.domain.Commande;
import com.saes.backend.domain.ModePaiement;
import com.saes.backend.domain.Paiement;
import com.saes.backend.domain.Restaurant;
import com.saes.backend.domain.SessionCaisse;
import com.saes.backend.domain.StatutCommande;
import com.saes.backend.repository.CommandeRepository;
import com.saes.backend.repository.PaiementRepository;
import com.saes.backend.repository.SessionCaisseRepository;
import com.saes.backend.web.dto.EcartCaisseDto;
import com.saes.backend.web.dto.EncaissementJourDto;
import com.saes.backend.web.dto.RapportFinancierDto;

import lombok.RequiredArgsConstructor;

/**
 * Consulter les rapports financiers (cahier des charges §4.5), reserve au
 * gerant : montants encaisses par jour et par mode de paiement, ecarts de
 * caisse et montant des commandes abandonnees, sur une periode.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GerantRapportService {

    private static final ZoneId ZONE = ZoneId.systemDefault();

    private final PaiementRepository paiementRepository;
    private final CommandeRepository commandeRepository;
    private final SessionCaisseRepository sessionCaisseRepository;
    private final PersonnelRestaurantResolver personnelRestaurantResolver;

    public RapportFinancierDto consulter(Long gerantId, LocalDate debut, LocalDate fin) {
        Restaurant restaurant = personnelRestaurantResolver.restaurantDe(gerantId);
        Instant debutInstant = debut.atStartOfDay(ZONE).toInstant();
        Instant finInstant = fin.plusDays(1).atStartOfDay(ZONE).toInstant();

        List<Paiement> paiements = paiementRepository.findByCommande_Restaurant_IdAndDateHeureBetween(
                restaurant.getId(), debutInstant, finInstant);

        Map<LocalDate, int[]> parJour = new LinkedHashMap<>();
        for (Paiement paiement : paiements) {
            LocalDate jour = paiement.getDateHeure().atZone(ZONE).toLocalDate();
            int[] montants = parJour.computeIfAbsent(jour, j -> new int[2]);
            int montantCommande = montant(paiement.getCommande());
            if (paiement.getModePaiement() == ModePaiement.ESPECES) {
                montants[0] += montantCommande;
            } else {
                montants[1] += montantCommande;
            }
        }
        List<EncaissementJourDto> encaissementsParJour = parJour.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> new EncaissementJourDto(e.getKey(), e.getValue()[0], e.getValue()[1]))
                .toList();

        List<SessionCaisse> sessions = sessionCaisseRepository
                .findByCaissier_Restaurant_IdAndDateHeureClotureBetween(restaurant.getId(), debutInstant, finInstant)
                .stream()
                .sorted(Comparator.comparing(SessionCaisse::getDateHeureCloture))
                .toList();
        List<EcartCaisseDto> ecartsCaisse = sessions.stream()
                .map(session -> {
                    int totalEspeces = paiementRepository.findBySessionCaisse_Id(session.getId()).stream()
                            .filter(p -> p.getModePaiement() == ModePaiement.ESPECES)
                            .mapToInt(p -> montant(p.getCommande()))
                            .sum();
                    return EcartCaisseDto.from(session, session.getFondDeCaisse() + totalEspeces);
                })
                .toList();

        int montantCommandesAbandonnees = commandeRepository
                .findByRestaurantIdAndStatutAndDateHeureBetween(
                        restaurant.getId(), StatutCommande.ABANDONNEE, debutInstant, finInstant)
                .stream()
                .mapToInt(this::montant)
                .sum();

        return new RapportFinancierDto(encaissementsParJour, ecartsCaisse, montantCommandesAbandonnees);
    }

    private int montant(Commande commande) {
        return commande.getLignes().stream().mapToInt(l -> l.getPrixUnitaire() * l.getQuantite()).sum();
    }
}
