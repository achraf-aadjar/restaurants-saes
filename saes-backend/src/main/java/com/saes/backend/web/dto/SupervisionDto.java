package com.saes.backend.web.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import com.saes.backend.domain.CategoriePlat;
import com.saes.backend.domain.ModePaiement;
import com.saes.backend.domain.Role;
import com.saes.backend.domain.StatutCommande;
import com.saes.backend.domain.StatutReservation;
import com.saes.backend.domain.TypeCommande;
import com.saes.backend.domain.Unite;

/** Donnees de l'espace d'administration (supervision de tous les restaurants, en lecture). */
public final class SupervisionDto {

    private SupervisionDto() {
    }

    public record TableauDeBord(
            Indicateurs indicateurs,
            Finances finances,
            List<VenteParPlat> meilleursPlats,
            List<JournalOperationDto> activiteRecente) {
    }

    public record Indicateurs(
            long restaurantsActifs,
            long restaurantsDesactives,
            long comptesActifs,
            long comptesDesactives,
            Map<Role, Long> comptesParRole,
            Map<StatutCommande, Long> commandesEnCours,
            long caissesOuvertes,
            long reservationsAujourdhui,
            long ingredientsEnAlerte) {
    }

    public record Finances(
            int chiffreAffaires,
            int encaisseEspeces,
            int encaisseMobileMoney,
            long commandesPayees,
            double panierMoyen,
            int montantAbandonne,
            List<EncaissementJourDto> parJour,
            List<ParRestaurant> parRestaurant) {
    }

    public record ParRestaurant(Long restaurantId, String restaurant, int chiffreAffaires, long commandesPayees) {
    }

    public record VenteParPlat(String plat, String restaurant, CategoriePlat categorie, int quantite, int montant) {
    }

    public record Commande(
            Long id,
            String restaurant,
            Instant dateHeure,
            TypeCommande type,
            Integer tableNumero,
            String passeePar,
            StatutCommande statut,
            int montantTotal,
            String lignes,
            ModePaiement modePaiement) {
    }

    public record Reservation(
            Long id,
            String restaurant,
            String client,
            LocalDateTime dateHeure,
            int dureeMinutes,
            int nombreCouverts,
            StatutReservation statut,
            List<Integer> tables) {
    }

    public record Caisse(
            Long id,
            String restaurant,
            String caissier,
            Instant ouverture,
            Instant cloture,
            int fondDeCaisse,
            int encaisseEspeces,
            int encaisseMobileMoney,
            int montantTheorique,
            Integer montantCompte,
            Integer ecart) {
    }

    public record Stock(
            Long ingredientId,
            String restaurant,
            String ingredient,
            Unite unite,
            BigDecimal stock,
            BigDecimal seuilAlerte,
            BigDecimal niveauCible,
            boolean alerte,
            BigDecimal aReapprovisionner) {
    }

    /** Jours de la periode, y compris ceux sans encaissement (pour les graphiques). */
    public static List<LocalDate> jours(LocalDate debut, LocalDate fin) {
        return debut.datesUntil(fin.plusDays(1)).toList();
    }
}
