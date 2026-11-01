package com.saes.backend.web.dto;

import java.time.Instant;
import java.util.List;

import com.saes.backend.domain.Commande;
import com.saes.backend.domain.StatutCommande;
import com.saes.backend.domain.TypeCommande;

/**
 * /montantTotal est derive : somme des prixUnitaire x quantite des lignes
 * (regle 4 du cahier des charges), jamais enregistre.
 */
public record CommandeDto(
        Long id,
        Long restaurantId,
        Long tableId,
        Integer tableNumero,
        TypeCommande type,
        StatutCommande statut,
        Instant dateHeure,
        Long version,
        int montantTotal,
        List<LigneCommandeDto> lignes) {

    public static CommandeDto from(Commande c) {
        int montant = c.getLignes().stream().mapToInt(l -> l.getPrixUnitaire() * l.getQuantite()).sum();
        return new CommandeDto(
                c.getId(),
                c.getRestaurant().getId(),
                c.getTable() != null ? c.getTable().getId() : null,
                c.getTable() != null ? c.getTable().getNumero() : null,
                c.getType(),
                c.getStatut(),
                c.getDateHeure(),
                c.getVersion(),
                montant,
                c.getLignes().stream().map(LigneCommandeDto::from).toList());
    }
}
