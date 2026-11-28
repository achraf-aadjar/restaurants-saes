package com.saes.backend.web.dto;

import java.util.Set;

import com.saes.backend.domain.ProfilClient;
import com.saes.backend.domain.Role;
import com.saes.backend.domain.Utilisateur;

public record UtilisateurDto(
        Long id,
        String nom,
        String prenom,
        String email,
        String telephone,
        ProfilClient profil,
        Set<Role> roles,
        Long restaurantId,
        String restaurantNom,
        boolean estActif) {

    public static UtilisateurDto from(Utilisateur u) {
        return new UtilisateurDto(
                u.getId(),
                u.getNom(),
                u.getPrenom(),
                u.getEmail(),
                u.getTelephone(),
                u.getProfil(),
                u.getRoles(),
                u.getRestaurant() != null ? u.getRestaurant().getId() : null,
                u.getRestaurant() != null ? u.getRestaurant().getNom() : null,
                u.isEstActif());
    }
}
