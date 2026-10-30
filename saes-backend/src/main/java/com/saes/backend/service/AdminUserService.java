package com.saes.backend.service;

import java.util.List;

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
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminUserService {

    private static final java.util.Set<Role> ROLES_PERSONNEL =
            java.util.Set.of(Role.SERVEUR, Role.CUISINIER, Role.CAISSIER, Role.GERANT);

    private final UtilisateurRepository utilisateurRepository;
    private final RestaurantRepository restaurantRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UtilisateurDto> lister() {
        return utilisateurRepository.findAll().stream().map(UtilisateurDto::from).toList();
    }

    @Transactional
    public UtilisateurDto creerPersonnel(CreateStaffRequest request) {
        if (utilisateurRepository.existsByEmailIgnoreCase(request.email())) {
            throw ApiException.conflict("Cette adresse e-mail est deja utilisee");
        }
        Restaurant restaurant = restaurantRepository.findById(request.restaurantId())
                .orElseThrow(() -> ApiException.notFound("Restaurant introuvable"));

        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setNom(request.nom());
        utilisateur.setPrenom(request.prenom());
        utilisateur.setEmail(request.email());
        utilisateur.setMotDePasse(passwordEncoder.encode(request.motDePasse()));
        utilisateur.setTelephone(request.telephone());
        utilisateur.setRestaurant(restaurant);
        utilisateur.setRoles(new java.util.HashSet<>(request.roles()));
        utilisateur.setEstActif(true);

        return UtilisateurDto.from(utilisateurRepository.save(utilisateur));
    }

    @Transactional
    public UtilisateurDto modifierRoles(Long utilisateurId, UpdateRolesRequest request) {
        Utilisateur utilisateur = trouver(utilisateurId);
        if (request.roles().isEmpty()) {
            throw ApiException.conflict("Le compte se retrouverait sans aucun role");
        }
        boolean demandeUnRolePersonnel = request.roles().stream().anyMatch(ROLES_PERSONNEL::contains);
        if (demandeUnRolePersonnel && utilisateur.getRestaurant() == null) {
            throw ApiException.conflict(
                    "Ce compte n'est rattache a aucun restaurant : impossible de lui donner un role de personnel");
        }
        utilisateur.setRoles(new java.util.HashSet<>(request.roles()));
        return UtilisateurDto.from(utilisateur);
    }

    @Transactional
    public UtilisateurDto changerActivation(Long utilisateurId, boolean actif) {
        Utilisateur utilisateur = trouver(utilisateurId);
        utilisateur.setEstActif(actif);
        return UtilisateurDto.from(utilisateur);
    }

    private Utilisateur trouver(Long id) {
        return utilisateurRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Utilisateur introuvable"));
    }
}
