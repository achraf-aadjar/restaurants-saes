package com.saes.backend.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.saes.backend.domain.ActionJournal;
import com.saes.backend.domain.Commande;
import com.saes.backend.domain.LigneCommande;
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

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
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
    private final EntityManager entityManager;
    private final JournalService journalService;

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
        if (!restaurant.isEstActif()) {
            // Regle 13 : un restaurant desactive n'accepte plus de commande, ni du client ni du serveur.
            throw ApiException.conflict("Ce restaurant est désactivé : il n'accepte plus de commande");
        }
        Utilisateur serveur = utilisateurRepository.getReferenceById(serveurId);

        TableRestaurant table = null;
        if (request.type() == TypeCommande.SUR_PLACE) {
            if (request.tableId() == null) {
                throw ApiException.badRequest("Une table est requise pour une commande sur place");
            }
            table = tableRestaurantRepository.findById(request.tableId())
                    .orElseThrow(() -> ApiException.notFound("Table introuvable"));
            if (!table.getRestaurant().getId().equals(restaurant.getId())) {
                throw ApiException.badRequest("Cette table n'appartient pas à votre restaurant");
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

        modifierLignes(restaurant, commande, request);

        // Seules les lignes changent : sans cela la version de la commande
        // resterait la meme et la regle 3 ne detecterait pas la modification.
        entityManager.lock(commande, LockModeType.PESSIMISTIC_FORCE_INCREMENT);
        CommandeDto modifiee = CommandeDto.from(commandeRepository.saveAndFlush(commande));
        journalService.enregistrer(ActionJournal.COMMANDE_MODIFIEE, "COMMANDE", commande.getId(),
                "Nouveau montant : " + modifiee.montantTotal() + " FCFA");
        return modifiee;
    }

    /**
     * Les plats deja dans la commande y restent tels quels : leur prix est celui du moment
     * ou ils ont ete ajoutes (regle 4), et la regle 2 ne s'applique qu'a ce qu'on ajoute. Un
     * plat devenu inactif peut donc rester, diminuer ou partir, mais pas augmenter. Une seule
     * ligne par plat (LigneCommande est une classe-association) : sa quantite change, son
     * prix non.
     */
    private void modifierLignes(Restaurant restaurant, Commande commande, ModifierCommandeRequest request) {
        LocalDate aujourdHui = LocalDate.now();
        Map<Long, Integer> demandees = new LinkedHashMap<>();
        request.lignes().forEach(l -> demandees.merge(l.platId(), l.quantite(), Integer::sum));

        Map<Long, LigneCommande> gardees = new HashMap<>();
        Map<Long, Integer> quantitesActuelles = new HashMap<>();
        for (Iterator<LigneCommande> it = commande.getLignes().iterator(); it.hasNext();) {
            LigneCommande ligne = it.next();
            Long platId = ligne.getPlat().getId();
            quantitesActuelles.merge(platId, ligne.getQuantite(), Integer::sum);
            if (!demandees.containsKey(platId) || gardees.putIfAbsent(platId, ligne) != null) {
                it.remove();
            }
        }

        demandees.forEach((platId, quantite) -> {
            LigneCommande gardee = gardees.get(platId);
            if (gardee == null) {
                LigneCommande ligne = commandeLigneFactory.nouvelleLigne(restaurant, platId, quantite, aujourdHui);
                ligne.setCommande(commande);
                commande.getLignes().add(ligne);
            } else {
                if (quantite > quantitesActuelles.get(platId)) {
                    commandeLigneFactory.verifierCommandable(restaurant, gardee.getPlat(), aujourdHui);
                }
                gardee.setQuantite(quantite);
            }
        });
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
        journalService.enregistrer(ActionJournal.COMMANDE_ANNULEE, "COMMANDE", commande.getId(), "Annulee par le serveur");
        return CommandeDto.from(commandeRepository.saveAndFlush(commande));
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
