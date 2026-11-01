package com.saes.backend.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.saes.backend.domain.Commande;
import com.saes.backend.domain.MouvementStock;
import com.saes.backend.domain.Restaurant;
import com.saes.backend.domain.StatutCommande;
import com.saes.backend.domain.TypeMouvement;
import com.saes.backend.repository.CommandeRepository;
import com.saes.backend.repository.MouvementStockRepository;
import com.saes.backend.web.dto.ActionAvecVersionRequest;
import com.saes.backend.web.dto.CommandeDto;
import com.saes.backend.web.error.ApiException;
import com.saes.backend.web.error.ConflitCommandeException;

import lombok.RequiredArgsConstructor;

/**
 * Gerer la preparation des commandes (cahier des charges §4.3), cote
 * cuisinier. Demarrer la preparation enregistre, dans la meme transaction,
 * une sortie de stock pour chaque ingredient de chaque plat commande
 * (descriptions_textuelles_6_scenarios.pdf, scenario 2).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CuisineService {

    private static final List<StatutCommande> STATUTS_A_PREPARER =
            List.of(StatutCommande.EN_ATTENTE, StatutCommande.EN_PREPARATION);

    private final CommandeRepository commandeRepository;
    private final MouvementStockRepository mouvementStockRepository;
    private final PersonnelRestaurantResolver personnelRestaurantResolver;
    private final CommandeRestaurantResolver commandeRestaurantResolver;

    public List<CommandeDto> commandesAPreparer(Long cuisinierId) {
        Restaurant restaurant = personnelRestaurantResolver.restaurantDe(cuisinierId);
        return commandeRepository
                .findByRestaurantIdAndStatutInOrderByDateHeureAsc(restaurant.getId(), STATUTS_A_PREPARER)
                .stream()
                .map(CommandeDto::from)
                .toList();
    }

    @Transactional
    public CommandeDto demarrerPreparation(Long cuisinierId, Long commandeId, ActionAvecVersionRequest request) {
        Restaurant restaurant = personnelRestaurantResolver.restaurantDe(cuisinierId);
        Commande commande = commandeRestaurantResolver.commandeDe(commandeId, restaurant);

        if (!commande.getVersion().equals(request.version())) {
            throw new ConflitCommandeException(CommandeDto.from(commande));
        }
        if (commande.getStatut() != StatutCommande.EN_ATTENTE) {
            throw ApiException.conflict("Cette commande n'est plus en attente");
        }

        commande.setStatut(StatutCommande.EN_PREPARATION);
        commande.getLignes().forEach(ligne -> ligne.getPlat().getRecette().forEach(recette -> {
            MouvementStock sortie = new MouvementStock();
            sortie.setIngredient(recette.getIngredient());
            sortie.setType(TypeMouvement.SORTIE);
            sortie.setQuantite(recette.getQuantiteNecessaire().multiply(BigDecimal.valueOf(ligne.getQuantite())));
            sortie.setDateHeure(Instant.now());
            mouvementStockRepository.save(sortie);
        }));

        return CommandeDto.from(commande);
    }

    @Transactional
    public CommandeDto terminerPreparation(Long cuisinierId, Long commandeId, ActionAvecVersionRequest request) {
        Restaurant restaurant = personnelRestaurantResolver.restaurantDe(cuisinierId);
        Commande commande = commandeRestaurantResolver.commandeDe(commandeId, restaurant);

        if (!commande.getVersion().equals(request.version())) {
            throw new ConflitCommandeException(CommandeDto.from(commande));
        }
        if (commande.getStatut() != StatutCommande.EN_PREPARATION) {
            throw ApiException.conflict("Cette commande n'est pas en preparation");
        }

        commande.setStatut(StatutCommande.PRETE);
        return CommandeDto.from(commande);
    }
}
