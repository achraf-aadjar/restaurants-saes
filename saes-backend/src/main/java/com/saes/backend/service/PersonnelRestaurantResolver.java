package com.saes.backend.service;

import org.springframework.stereotype.Component;

import com.saes.backend.domain.Restaurant;
import com.saes.backend.domain.Utilisateur;
import com.saes.backend.repository.UtilisateurRepository;
import com.saes.backend.web.error.ApiException;

import lombok.RequiredArgsConstructor;

/**
 * Le personnel (serveur, cuisinier, caissier, gerant) n'exerce ses roles
 * que dans le restaurant auquel il est rattache (cahier des charges §3).
 */
@Component
@RequiredArgsConstructor
class PersonnelRestaurantResolver {

    private final UtilisateurRepository utilisateurRepository;

    Restaurant restaurantDe(Long utilisateurId) {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> ApiException.notFound("Utilisateur introuvable"));
        if (utilisateur.getRestaurant() == null) {
            throw ApiException.forbidden("Ce compte n'est rattache a aucun restaurant");
        }
        return utilisateur.getRestaurant();
    }
}
