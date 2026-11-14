package com.saes.backend.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import com.saes.backend.domain.LigneCommande;
import com.saes.backend.domain.Plat;
import com.saes.backend.domain.Restaurant;
import com.saes.backend.repository.MenuRepository;
import com.saes.backend.repository.PlatRepository;
import com.saes.backend.web.dto.LigneDemandeeDto;
import com.saes.backend.web.error.ApiException;

import lombok.RequiredArgsConstructor;

/**
 * Construit les lignes d'une commande a partir des plats demandes, en
 * appliquant la regle 2 du cahier des charges : seul un plat actif d'un
 * menu en vigueur peut etre commande ou ajoute a une commande. Partage
 * entre « Passer une commande » (client) et « Prendre une commande » /
 * « Modifier une commande » (serveur).
 */
@Component
@RequiredArgsConstructor
class CommandeLigneFactory {

    private final PlatRepository platRepository;
    private final MenuRepository menuRepository;

    List<LigneCommande> construire(Restaurant restaurant, List<LigneDemandeeDto> lignesDemandees) {
        LocalDate aujourdHui = LocalDate.now();
        List<LigneCommande> lignes = new ArrayList<>();

        for (LigneDemandeeDto demande : lignesDemandees) {
            lignes.add(nouvelleLigne(restaurant, demande.platId(), demande.quantite(), aujourdHui));
        }

        return lignes;
    }

    /** Une ligne pour un plat ajoute maintenant : il doit etre commandable, a son prix du jour (regle 4). */
    LigneCommande nouvelleLigne(Restaurant restaurant, Long platId, int quantite, LocalDate aujourdHui) {
        Plat plat = platRepository.findById(platId)
                .orElseThrow(() -> ApiException.badRequest("Plat introuvable"));
        verifierCommandable(restaurant, plat, aujourdHui);

        LigneCommande ligne = new LigneCommande();
        ligne.setPlat(plat);
        ligne.setQuantite(quantite);
        ligne.setPrixUnitaire(plat.getPrix());
        return ligne;
    }

    /** Regle 2 : le plat est actif, du restaurant, et dans un menu en vigueur. */
    void verifierCommandable(Restaurant restaurant, Plat plat, LocalDate aujourdHui) {
        if (!plat.getRestaurant().getId().equals(restaurant.getId())) {
            throw ApiException.badRequest("Ce plat n'appartient pas à ce restaurant");
        }
        if (!menuRepository.estCommandable(restaurant.getId(), plat.getId(), aujourdHui)) {
            throw ApiException.conflict(
                    "Le plat \"" + plat.getNom() + "\" n'est pas actif ou n'est dans aucun menu en vigueur");
        }
    }
}
