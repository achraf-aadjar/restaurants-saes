package com.saes.backend.service;

import java.util.EnumSet;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.saes.backend.domain.Commande;
import com.saes.backend.domain.Restaurant;
import com.saes.backend.domain.StatutCommande;
import com.saes.backend.repository.CommandeRepository;
import com.saes.backend.web.dto.ActionAvecVersionRequest;
import com.saes.backend.web.dto.CommandeDto;
import com.saes.backend.web.error.ApiException;
import com.saes.backend.web.error.ConflitCommandeException;

import lombok.RequiredArgsConstructor;

/**
 * Declarer une commande abandonnee (cahier des charges §4.3), cote gerant.
 * Le cahier ne decrit pas de fonction de listage pour le gerant ; GET
 * /api/gerant/commandes est une extension raisonnable pour que la fonction
 * soit utilisable (il faut bien savoir quelle commande declarer abandonnee).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GerantCommandeService {

    private static final List<StatutCommande> STATUTS_ABANDONNABLES =
            List.of(StatutCommande.EN_PREPARATION, StatutCommande.PRETE);

    private final PersonnelRestaurantResolver personnelRestaurantResolver;
    private final CommandeRestaurantResolver commandeRestaurantResolver;
    private final CommandeRepository commandeRepository;

    public List<CommandeDto> commandesAbandonnables(Long gerantId) {
        Restaurant restaurant = personnelRestaurantResolver.restaurantDe(gerantId);
        return commandeRepository
                .findByRestaurantIdAndStatutInOrderByDateHeureAsc(restaurant.getId(), STATUTS_ABANDONNABLES)
                .stream()
                .map(CommandeDto::from)
                .toList();
    }

    @Transactional
    public CommandeDto declarerAbandonnee(Long gerantId, Long commandeId, ActionAvecVersionRequest request) {
        Restaurant restaurant = personnelRestaurantResolver.restaurantDe(gerantId);
        Commande commande = commandeRestaurantResolver.commandeDe(commandeId, restaurant);

        if (!commande.getVersion().equals(request.version())) {
            throw new ConflitCommandeException(CommandeDto.from(commande));
        }
        if (!STATUTS_ABANDONNABLES.contains(commande.getStatut())) {
            throw ApiException.conflict("Cette commande n'est ni en preparation ni prete");
        }

        commande.setStatut(StatutCommande.ABANDONNEE);
        return CommandeDto.from(commande);
    }
}
