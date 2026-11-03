package com.saes.backend.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.saes.backend.domain.Commande;
import com.saes.backend.domain.Restaurant;
import com.saes.backend.domain.StatutCommande;
import com.saes.backend.domain.StatutReservation;
import com.saes.backend.domain.TableRestaurant;
import com.saes.backend.domain.TypeCommande;
import com.saes.backend.domain.Utilisateur;
import com.saes.backend.repository.CommandeRepository;
import com.saes.backend.repository.ReservationRepository;
import com.saes.backend.repository.TableRestaurantRepository;
import com.saes.backend.repository.UtilisateurRepository;
import com.saes.backend.web.dto.ActionAvecVersionRequest;
import com.saes.backend.web.dto.CommandeDto;
import com.saes.backend.web.dto.ModifierCommandeRequest;
import com.saes.backend.web.dto.OccupationRestaurantDto;
import com.saes.backend.web.dto.PrendreCommandeRequest;
import com.saes.backend.web.dto.ReservationDto;
import com.saes.backend.web.dto.TableOccupationDto;
import com.saes.backend.web.error.ApiException;
import com.saes.backend.web.error.ConflitCommandeException;

import lombok.RequiredArgsConstructor;

/**
 * Prendre une commande, Modifier ou annuler une commande, Visualiser
 * l'occupation des tables (cahier des charges §4.3), cote serveur.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommandeServeurService {

    private static final List<StatutCommande> STATUTS_OCCUPATION =
            List.of(StatutCommande.EN_ATTENTE, StatutCommande.EN_PREPARATION, StatutCommande.PRETE);

    private final CommandeRepository commandeRepository;
    private final TableRestaurantRepository tableRestaurantRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final ReservationRepository reservationRepository;
    private final CommandeLigneFactory commandeLigneFactory;
    private final PersonnelRestaurantResolver personnelRestaurantResolver;
    private final CommandeRestaurantResolver commandeRestaurantResolver;

    /**
     * Pas une fonction nommee du cahier des charges : liste necessaire pour
     * que « Modifier ou annuler une commande » soit utilisable (il faut
     * savoir quelle commande choisir).
     */
    public List<CommandeDto> commandesEnAttente(Long serveurId) {
        Restaurant restaurant = personnelRestaurantResolver.restaurantDe(serveurId);
        return commandeRepository
                .findByRestaurantIdAndStatutInOrderByDateHeureAsc(
                        restaurant.getId(), List.of(StatutCommande.EN_ATTENTE))
                .stream()
                .map(CommandeDto::from)
                .toList();
    }

    @Transactional
    public CommandeDto prendreCommande(Long serveurId, PrendreCommandeRequest request) {
        Restaurant restaurant = personnelRestaurantResolver.restaurantDe(serveurId);
        Utilisateur serveur = utilisateurRepository.getReferenceById(serveurId);

        TableRestaurant table = null;
        if (request.type() == TypeCommande.SUR_PLACE) {
            if (request.tableId() == null) {
                throw ApiException.badRequest("Une table est requise pour une commande sur place");
            }
            table = tableRestaurantRepository.findById(request.tableId())
                    .orElseThrow(() -> ApiException.notFound("Table introuvable"));
            if (!table.getRestaurant().getId().equals(restaurant.getId())) {
                throw ApiException.badRequest("Cette table n'appartient pas a votre restaurant");
            }
        }

        Commande commande = new Commande();
        commande.setRestaurant(restaurant);
        commande.setServeur(serveur);
        commande.setTable(table);
        commande.setType(request.type());
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
    public CommandeDto modifierCommande(Long serveurId, Long commandeId, ModifierCommandeRequest request) {
        Restaurant restaurant = personnelRestaurantResolver.restaurantDe(serveurId);
        Commande commande = commandeRestaurantResolver.commandeDe(commandeId, restaurant);

        if (!commande.getVersion().equals(request.version())) {
            throw new ConflitCommandeException(CommandeDto.from(commande));
        }
        if (commande.getStatut() != StatutCommande.EN_ATTENTE) {
            throw ApiException.conflict("Cette commande n'est plus en attente");
        }

        commande.getLignes().clear();
        commandeLigneFactory.construire(restaurant, request.lignes())
                .forEach(ligne -> {
                    ligne.setCommande(commande);
                    commande.getLignes().add(ligne);
                });

        return CommandeDto.from(commande);
    }

    @Transactional
    public CommandeDto annulerCommande(Long serveurId, Long commandeId, ActionAvecVersionRequest request) {
        Restaurant restaurant = personnelRestaurantResolver.restaurantDe(serveurId);
        Commande commande = commandeRestaurantResolver.commandeDe(commandeId, restaurant);

        if (!commande.getVersion().equals(request.version())) {
            throw new ConflitCommandeException(CommandeDto.from(commande));
        }
        if (commande.getStatut() != StatutCommande.EN_ATTENTE) {
            throw ApiException.conflict("Cette commande n'est plus en attente");
        }
        commande.setStatut(StatutCommande.ANNULEE);
        return CommandeDto.from(commande);
    }

    public OccupationRestaurantDto occupationTables(Long serveurId) {
        Restaurant restaurant = personnelRestaurantResolver.restaurantDe(serveurId);

        List<Long> idsOccupees = commandeRepository.idsTablesOccupees(restaurant.getId(), STATUTS_OCCUPATION);
        List<TableOccupationDto> tables = restaurant.getTables().stream()
                .map(t -> new TableOccupationDto(t.getId(), t.getNumero(), t.getCapacite(), idsOccupees.contains(t.getId())))
                .toList();

        LocalDate aujourdHui = LocalDate.now();
        LocalDateTime debutJour = aujourdHui.atStartOfDay();
        LocalDateTime finJour = aujourdHui.plusDays(1).atStartOfDay();
        List<ReservationDto> reservationsDuJour = reservationRepository
                .findByRestaurantIdAndStatutAndDateHeureBetween(
                        restaurant.getId(), StatutReservation.CONFIRMEE, debutJour, finJour)
                .stream()
                .map(ReservationDto::from)
                .toList();

        return new OccupationRestaurantDto(tables, reservationsDuJour);
    }

}
