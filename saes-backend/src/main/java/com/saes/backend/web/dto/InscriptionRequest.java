package com.saes.backend.web.dto;

import jakarta.validation.constraints.Email;
import com.saes.backend.domain.ProfilClient;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * S'inscrire (cahier des charges §4.1) : nom, prenom, adresse e-mail, mot de
 * passe, telephone. Ecart assume : on demande aussi le profil (etudiant ou
 * professeur), car des abonnements existent pour chacun.
 */
public record InscriptionRequest(
        @NotBlank String nom,
        @NotBlank String prenom,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, message = "doit contenir au moins 8 caractères") String motDePasse,
        String telephone,
        @NotNull(message = "indiquez si vous êtes étudiant ou professeur") ProfilClient profil) {
}
