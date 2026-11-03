package com.saes.backend.service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.saes.backend.domain.Commande;
import com.saes.backend.domain.StatutCommande;
import com.saes.backend.domain.TypeCommande;
import com.saes.backend.domain.Restaurant;
import com.saes.backend.domain.Utilisateur;
import com.saes.backend.repository.CommandeRepository;
import com.saes.backend.repository.RestaurantRepository;
import com.saes.backend.repository.UtilisateurRepository;
import com.saes.backend.web.dto.ActionAvecVersionRequest;
import com.saes.backend.web.dto.CommandeDto;
import com.saes.backend.web.dto.PasserCommandeRequest;
import com.saes.backend.web.error.ApiException;
import com.saes.backend.web.error.ConflitCommandeException;

import lombok.RequiredArgsConstructor;

/**
 * Passer une commande, Suivre sa commande, Annuler sa commande (cahier des
 * charges §4.3), cote client.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommandeClientService {

    private final CommandeRepository commandeRepository;
    private final RestaurantRepository restaurantRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final HoraireService horaireService;
    private final CommandeLigneFactory commandeLigneFactory;

    public List<CommandeDto> suivreCommandes(Long clientId) {
        return commandeRepository.findByClientIdOrderByDateHeureDesc(clientId).stream()
                .map(CommandeDto::from)
                .toList();
    }

    @Transactional
    public CommandeDto passerCommande(Long clientId, PasserCommandeRequest request) {
        Utilisateur client = utilisateurRepository.findById(clientId)
                .orElseThrow(() -> ApiException.notFound("Utilisateur introuvable"));
        Restaurant restaurant = restaurantRepository.findById(request.restaurantId())
                .orElseThrow(() -> ApiException.notFound("Restaurant introuvable"));
        if (!restaurant.isEstActif()) {
            throw ApiException.notFound("Restaurant introuvable");
        }

        LocalDateTime maintenant = LocalDateTime.ofInstant(Instant.now(), ZoneId.systemDefault());
        if (!horaireService.estOuvertA(restaurant, maintenant)) {
            throw ApiException.conflict("Le restaurant n'est pas ouvert en ce moment");
        }

        Commande commande = new Commande();
        commande.setRestaurant(restaurant);
        commande.setClient(client);
        commande.setType(TypeCommande.A_EMPORTER);
        commande.setStatut(StatutCommande.EN_ATTENTE);
        commande.setDateHeure(Instant.now());
        commandeLigneFactory.construire(restaurant, request.lignes())
                .forEach(ligne -> {
                    ligne.setCommande(commande);
                    commande.getLignes().add(ligne);
                });

        return CommandeDto.from(commandeRepository.save(commande));
    }

    @Transactional
    public CommandeDto annulerCommande(Long clientId, Long commandeId, ActionAvecVersionRequest request) {
        Commande commande = commandeRepository.findById(commandeId)
                .orElseThrow(() -> ApiException.notFound("Commande introuvable"));
        if (commande.getClient() == null || !commande.getClient().getId().equals(clientId)) {
            throw ApiException.forbidden("Cette commande n'est pas la votre");
        }
        if (!commande.getVersion().equals(request.version())) {
            throw new ConflitCommandeException(CommandeDto.from(commande));
        }
        if (commande.getStatut() != StatutCommande.EN_ATTENTE) {
            throw ApiException.conflict("Cette commande n'est plus en attente");
        }
        commande.setStatut(StatutCommande.ANNULEE);
        return CommandeDto.from(commande);
    }
}
