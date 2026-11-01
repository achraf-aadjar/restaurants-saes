package com.saes.backend.service;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.saes.backend.domain.Restaurant;
import com.saes.backend.domain.Role;
import com.saes.backend.domain.Utilisateur;
import com.saes.backend.repository.RestaurantRepository;
import com.saes.backend.repository.UtilisateurRepository;
import com.saes.backend.web.dto.CreateStaffRequest;
import com.saes.backend.web.dto.UpdateRolesRequest;
import com.saes.backend.web.dto.UtilisateurDto;
import com.saes.backend.web.error.ApiException;

import lombok.RequiredArgsConstructor;

/**
 * Gerer les comptes utilisateurs (cahier des charges §4.7), reserve a
 * l'administrateur : creer des comptes pour le personnel, attribuer/retirer
 * des roles, desactiver/reactiver un compte.
 *
 * Contrainte 2 de la conception : un utilisateur a un restaurant si et
 * seulement s'il a un role du personnel.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminUserService {

    private static final Set<Role> ROLES_PERSONNEL =
            EnumSet.of(Role.SERVEUR, Role.CUISINIER, Role.CAISSIER, Role.GERANT);

    private final UtilisateurRepository utilisateurRepository;
    private final RestaurantRepository restaurantRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UtilisateurDto> lister() {
        return utilisateurRepository.findAll().stream().map(UtilisateurDto::from).toList();
    }

    @Transactional
    public UtilisateurDto creerPersonnel(CreateStaffRequest request) {
        if (utilisateurRepository.existsByEmailIgnoreCase(request.email())) {
            throw ApiException.conflict("Cette adresse e-mail est déjà utilisée");
        }
        if (!estPersonnel(request.roles())) {
            throw ApiException.badRequest("Le compte doit avoir au moins un rôle du personnel");
        }

        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setNom(request.nom());
        utilisateur.setPrenom(request.prenom());
        utilisateur.setEmail(request.email());
        utilisateur.setMotDePasse(passwordEncoder.encode(request.motDePasse()));
        utilisateur.setTelephone(request.telephone());
        utilisateur.setRestaurant(trouverRestaurant(request.restaurantId()));
        utilisateur.setRoles(EnumSet.copyOf(request.roles()));
        utilisateur.setEstActif(true);

        return UtilisateurDto.from(utilisateurRepository.save(utilisateur));
    }

    @Transactional
    public UtilisateurDto modifierRoles(Long utilisateurId, UpdateRolesRequest request) {
        Utilisateur utilisateur = trouver(utilisateurId);
        if (request.roles().isEmpty()) {
            throw ApiException.conflict("Le compte se retrouverait sans aucun rôle");
        }

        if (!estPersonnel(request.roles())) {
            utilisateur.setRestaurant(null);
        } else if (utilisateur.getRestaurant() == null) {
            if (request.restaurantId() == null) {
                throw ApiException.badRequest("Indiquez le restaurant de ce membre du personnel");
            }
            utilisateur.setRestaurant(trouverRestaurant(request.restaurantId()));
        }
        utilisateur.setRoles(EnumSet.copyOf(request.roles()));
        return UtilisateurDto.from(utilisateur);
    }

    @Transactional
    public UtilisateurDto changerActivation(Long utilisateurId, boolean actif) {
        Utilisateur utilisateur = trouver(utilisateurId);
        utilisateur.setEstActif(actif);
        return UtilisateurDto.from(utilisateur);
    }

    private static boolean estPersonnel(Set<Role> roles) {
        return roles.stream().anyMatch(ROLES_PERSONNEL::contains);
    }

    private Utilisateur trouver(Long id) {
        return utilisateurRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Utilisateur introuvable"));
    }

    private Restaurant trouverRestaurant(Long id) {
        return restaurantRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Restaurant introuvable"));
    }
}
