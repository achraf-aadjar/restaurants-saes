package com.saes.backend.service;

import java.time.Instant;
import java.util.EnumSet;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.saes.backend.domain.Reservation;
import com.saes.backend.domain.Role;
import com.saes.backend.domain.StatutReservation;
import com.saes.backend.domain.Utilisateur;
import com.saes.backend.repository.ReservationRepository;
import com.saes.backend.repository.UtilisateurRepository;
import com.saes.backend.web.dto.CompteUpdateRequest;
import com.saes.backend.web.dto.UtilisateurDto;
import com.saes.backend.web.error.ApiException;

import lombok.RequiredArgsConstructor;

/**
 * Gerer son compte (cahier des charges §4.1) : voir/modifier ses
 * informations ; pour un client, supprimer son compte.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompteService {

    private final UtilisateurRepository utilisateurRepository;
    private final ReservationRepository reservationRepository;
    private final PasswordEncoder passwordEncoder;

    public UtilisateurDto consulter(Long utilisateurId) {
        return UtilisateurDto.from(trouver(utilisateurId));
    }

    @Transactional
    public UtilisateurDto modifier(Long utilisateurId, CompteUpdateRequest request) {
        Utilisateur utilisateur = trouver(utilisateurId);

        if (!utilisateur.getEmail().equalsIgnoreCase(request.email())
                && utilisateurRepository.existsByEmailIgnoreCase(request.email())) {
            throw ApiException.conflict("Cette adresse e-mail est déjà utilisée");
        }

        if (request.nouveauMotDePasse() != null && !request.nouveauMotDePasse().isBlank()) {
            if (request.motDePasseActuel() == null
                    || !passwordEncoder.matches(request.motDePasseActuel(), utilisateur.getMotDePasse())) {
                throw ApiException.badRequest("Le mot de passe actuel est incorrect");
            }
            utilisateur.setMotDePasse(passwordEncoder.encode(request.nouveauMotDePasse()));
        }

        utilisateur.setNom(request.nom());
        utilisateur.setPrenom(request.prenom());
        utilisateur.setEmail(request.email());
        utilisateur.setTelephone(request.telephone());
        return UtilisateurDto.from(utilisateur);
    }

    /**
     * Le compte est anonymise plutot que supprime : ses commandes doivent rester
     * (comptes et statistiques) et elles referencent le client. Plus aucune donnee
     * personnelle ne reste, et l'adresse e-mail est liberee. Ses reservations a
     * venir sont annulees pour liberer les tables.
     */
    @Transactional
    public void supprimer(Long utilisateurId) {
        Utilisateur utilisateur = trouver(utilisateurId);
        if (!utilisateur.getRoles().equals(EnumSet.of(Role.CLIENT))) {
            throw ApiException.forbidden("Seul un compte client peut être supprimé par son titulaire");
        }

        for (Reservation reservation : reservationRepository.findByClientIdAndStatutAndDateHeureAfter(
                utilisateurId, StatutReservation.CONFIRMEE, Instant.now())) {
            reservation.setStatut(StatutReservation.ANNULEE);
            reservation.getTables().forEach(table -> table.setStatut(StatutReservation.ANNULEE));
        }

        utilisateur.setNom("supprimé");
        utilisateur.setPrenom("Compte");
        utilisateur.setEmail("supprime-" + utilisateurId + "@saes.invalid");
        utilisateur.setTelephone(null);
        utilisateur.setMotDePasse(passwordEncoder.encode(UUID.randomUUID().toString()));
        utilisateur.setEstActif(false);
    }

    private Utilisateur trouver(Long id) {
        return utilisateurRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Utilisateur introuvable"));
    }
}
