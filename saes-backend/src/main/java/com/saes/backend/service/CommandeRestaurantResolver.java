package com.saes.backend.service;

import org.springframework.stereotype.Component;

import com.saes.backend.domain.Commande;
import com.saes.backend.domain.Restaurant;
import com.saes.backend.repository.CommandeRepository;
import com.saes.backend.web.error.ApiException;

import lombok.RequiredArgsConstructor;

/**
 * Regle 15 du cahier des charges : la table d'une commande appartient au
 * meme restaurant. Charge une commande et verifie qu'elle appartient bien
 * au restaurant du membre du personnel qui agit.
 */
@Component
@RequiredArgsConstructor
class CommandeRestaurantResolver {

    private final CommandeRepository commandeRepository;

    Commande commandeDe(Long commandeId, Restaurant restaurant) {
        Commande commande = commandeRepository.findById(commandeId)
                .orElseThrow(() -> ApiException.notFound("Commande introuvable"));
        if (!commande.getRestaurant().getId().equals(restaurant.getId())) {
            throw ApiException.forbidden("Cette commande n'appartient pas a votre restaurant");
        }
        return commande;
    }
}
