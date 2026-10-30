package com.saes.backend.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * S'inscrire (cahier des charges §4.1) : nom, prenom, adresse e-mail, mot de
 * passe, telephone.
 */
public record InscriptionRequest(
        @NotBlank String nom,
        @NotBlank String prenom,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, message = "doit contenir au moins 8 caracteres") String motDePasse,
        String telephone) {
}
