package com.saes.backend.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Gerer son compte (cahier des charges §4.1) : voir et modifier ses
 * informations. nouveauMotDePasse est facultatif ; s'il est donne,
 * motDePasseActuel est exige (OWASP ASVS 2.1.6).
 */
public record CompteUpdateRequest(
        @NotBlank String nom,
        @NotBlank String prenom,
        @NotBlank @Email String email,
        String telephone,
        String motDePasseActuel,
        @Size(min = 8, message = "doit contenir au moins 8 caractères") String nouveauMotDePasse) {
}
