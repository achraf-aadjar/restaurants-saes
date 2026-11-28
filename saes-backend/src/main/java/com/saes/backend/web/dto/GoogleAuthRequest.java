package com.saes.backend.web.dto;

import com.saes.backend.domain.ProfilClient;

import jakarta.validation.constraints.NotBlank;

/**
 * S'inscrire ou s'authentifier avec un compte Google (en plus de §4.1). Le profil
 * n'est lu qu'a la creation du compte : il est donne par l'ecran d'inscription et
 * ignore pour un compte qui existe deja.
 */
public record GoogleAuthRequest(@NotBlank String idToken, ProfilClient profil) {
}
