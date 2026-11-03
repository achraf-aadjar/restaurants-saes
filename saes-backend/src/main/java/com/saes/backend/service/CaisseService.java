package com.saes.backend.service;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.saes.backend.domain.Commande;
import com.saes.backend.domain.ModePaiement;
import com.saes.backend.domain.Paiement;
import com.saes.backend.domain.Restaurant;
import com.saes.backend.domain.SessionCaisse;
import com.saes.backend.domain.StatutCommande;
import com.saes.backend.domain.Utilisateur;
import com.saes.backend.repository.CommandeRepository;
import com.saes.backend.repository.PaiementRepository;
import com.saes.backend.repository.SessionCaisseRepository;
import com.saes.backend.repository.UtilisateurRepository;
import com.saes.backend.web.dto.ClotureCaisseRequest;
import com.saes.backend.web.dto.CommandeDto;
import com.saes.backend.web.dto.EncaisserRequest;
import com.saes.backend.web.dto.OuvrirCaisseRequest;
import com.saes.backend.web.dto.SessionCaisseDto;
import com.saes.backend.web.error.ApiException;
import com.saes.backend.web.error.ConflitCommandeException;

import lombok.RequiredArgsConstructor;

/**
 * Ouvrir la caisse, Encaisser une commande, Cloturer la caisse (cahier des
 * charges §4.5), cote caissier.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CaisseService {

    private final SessionCaisseRepository sessionCaisseRepository;
    private final PaiementRepository paiementRepository;
    private final CommandeRepository commandeRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final PersonnelRestaurantResolver personnelRestaurantResolver;
    private final CommandeRestaurantResolver commandeRestaurantResolver;

    public SessionCaisseDto maSessionOuverte(Long caissierId) {
        return sessionCaisseRepository.findByCaissierIdAndDateHeureClotureIsNull(caissierId)
                .map(SessionCaisseDto::ouverte)
                .orElse(null);
    }

    public List<CommandeDto> commandesPretes(Long caissierId) {
        Restaurant restaurant = personnelRestaurantResolver.restaurantDe(caissierId);
        return commandeRepository
                .findByRestaurantIdAndStatutInOrderByDateHeureAsc(restaurant.getId(), List.of(StatutCommande.PRETE))
                .stream()
                .map(CommandeDto::from)
                .toList();
    }

    @Transactional
    public SessionCaisseDto ouvrir(Long caissierId, OuvrirCaisseRequest request) {
        if (sessionCaisseRepository.findByCaissierIdAndDateHeureClotureIsNull(caissierId).isPresent()) {
            throw ApiException.conflict("Vous avez deja une caisse ouverte");
        }
        Utilisateur caissier = utilisateurRepository.getReferenceById(caissierId);

        SessionCaisse session = new SessionCaisse();
        session.setCaissier(caissier);
        session.setDateHeureOuverture(Instant.now());
        session.setFondDeCaisse(request.fondDeCaisse());

        return SessionCaisseDto.ouverte(sessionCaisseRepository.save(session));
    }

    @Transactional
    public CommandeDto encaisser(Long caissierId, Long commandeId, EncaisserRequest request) {
        Restaurant restaurant = personnelRestaurantResolver.restaurantDe(caissierId);
        Commande commande = commandeRestaurantResolver.commandeDe(commandeId, restaurant);
        SessionCaisse session = sessionCaisseRepository.findByCaissierIdAndDateHeureClotureIsNull(caissierId)
                .orElseThrow(() -> ApiException.conflict("Vous n'avez pas de caisse ouverte"));

        if (!commande.getVersion().equals(request.version())) {
            throw new ConflitCommandeException(CommandeDto.from(commande));
        }
        if (commande.getStatut() != StatutCommande.PRETE) {
            throw ApiException.conflict("Cette commande n'est pas prete");
        }

        commande.setStatut(StatutCommande.PAYEE);

        Paiement paiement = new Paiement();
        paiement.setCommande(commande);
        paiement.setSessionCaisse(session);
        paiement.setModePaiement(request.modePaiement());
        paiement.setDateHeure(Instant.now());
        paiementRepository.save(paiement);

        return CommandeDto.from(commande);
    }

    @Transactional
    public SessionCaisseDto cloturer(Long caissierId, ClotureCaisseRequest request) {
        SessionCaisse session = sessionCaisseRepository.findByCaissierIdAndDateHeureClotureIsNull(caissierId)
                .orElseThrow(() -> ApiException.conflict("Vous n'avez pas de caisse ouverte"));

        int totalEspeces = paiementRepository.findBySessionCaisse_Id(session.getId()).stream()
                .filter(p -> p.getModePaiement() == ModePaiement.ESPECES)
                .mapToInt(p -> p.getCommande().getLignes().stream()
                        .mapToInt(l -> l.getPrixUnitaire() * l.getQuantite())
                        .sum())
                .sum();
        int montantTheorique = session.getFondDeCaisse() + totalEspeces;
        int ecart = request.montantCompte() - montantTheorique;

        session.setDateHeureCloture(Instant.now());
        session.setMontantCompte(request.montantCompte());

        return SessionCaisseDto.cloturee(session, montantTheorique, ecart);
    }
}
