package com.saes.backend.web.dto;

import com.saes.backend.domain.ProfilClient;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Gerer son compte (cahier des charges §4.1) : voir et modifier ses
 * informations. nouveauMotDePasse est facultatif ; s'il est donne,
 * motDePasseActuel est exige (OWASP ASVS 2.1.6). Le profil (etudiant ou
 * professeur) est facultatif : absent, il reste ce qu'il etait.
 */
public record CompteUpdateRequest(
        @NotBlank String nom,
        @NotBlank String prenom,
        @NotBlank @Email String email,
        String telephone,
        ProfilClient profil,
        String motDePasseActuel,
        @Size(min = 8, message = "doit contenir au moins 8 caractères") String nouveauMotDePasse) {
}
